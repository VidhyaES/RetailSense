import logging
import warnings
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)


@dataclass
class ForecastResult:
    success: bool = False
    model_type: str = ''
    forecast_dates: list = field(default_factory=list)
    predicted_qty: list  = field(default_factory=list)
    lower_bound: list    = field(default_factory=list)
    upper_bound: list    = field(default_factory=list)
    mae: Optional[float]  = None
    rmse: Optional[float] = None
    error: Optional[str]  = None


class FeatureEngineer:
    def build_features(self, series):
        df = pd.DataFrame({'qty': series})
        df.index = pd.DatetimeIndex(df.index)

        df['day_of_week']    = df.index.dayofweek
        df['day_of_month']   = df.index.day
        df['month']          = df.index.month
        df['week_of_year']   = df.index.isocalendar().week.astype(int)
        df['quarter']        = df.index.quarter
        df['is_weekend']     = (df.index.dayofweek >= 5).astype(int)
        df['is_month_end']   = df.index.is_month_end.astype(int)
        df['is_month_start'] = df.index.is_month_start.astype(int)

        for lag in [1, 2, 3, 7, 14, 21, 28]:
            df[f'lag_{lag}'] = df['qty'].shift(lag)

        for window in [7, 14, 30]:
            df[f'rolling_mean_{window}'] = df['qty'].shift(1).rolling(window).mean()
            df[f'rolling_std_{window}']  = df['qty'].shift(1).rolling(window).std()
            df[f'rolling_max_{window}']  = df['qty'].shift(1).rolling(window).max()

        df['ewm_7']  = df['qty'].shift(1).ewm(span=7,  adjust=False).mean()
        df['ewm_30'] = df['qty'].shift(1).ewm(span=30, adjust=False).mean()
        df['trend']  = np.arange(len(df))

        return df

    def get_feature_columns(self):
        return [
            'day_of_week', 'day_of_month', 'month', 'week_of_year',
            'quarter', 'is_weekend', 'is_month_end', 'is_month_start',
            'lag_1', 'lag_2', 'lag_3', 'lag_7', 'lag_14', 'lag_21', 'lag_28',
            'rolling_mean_7', 'rolling_std_7', 'rolling_max_7',
            'rolling_mean_14', 'rolling_std_14', 'rolling_max_14',
            'rolling_mean_30', 'rolling_std_30', 'rolling_max_30',
            'ewm_7', 'ewm_30', 'trend',
        ]


class RandomForestForecaster:
    MIN_TRAINING_DAYS = 60

    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators     = 300,
            max_depth        = 12,
            min_samples_leaf = 2,
            max_features     = 'sqrt',
            random_state     = 42,
            n_jobs           = -1,
        )
        self.fe           = FeatureEngineer()
        self.feature_cols = self.fe.get_feature_columns()

    def forecast(self, series, horizon=30):
        result = ForecastResult(model_type='random_forest')

        if len(series) < self.MIN_TRAINING_DAYS:
            result.error = f'Need at least {self.MIN_TRAINING_DAYS} days of data'
            return result

        try:
            df       = self.fe.build_features(series)
            df_clean = df.dropna()
            X        = df_clean[self.feature_cols].values
            y        = df_clean['qty'].values

            tscv = TimeSeriesSplit(n_splits=3)
            mae_scores, rmse_scores = [], []

            for train_idx, val_idx in tscv.split(X):
                self.model.fit(X[train_idx], y[train_idx])
                preds = np.maximum(self.model.predict(X[val_idx]), 0)
                mae_scores.append(mean_absolute_error(y[val_idx], preds))
                rmse_scores.append(np.sqrt(mean_squared_error(y[val_idx], preds)))

            self.model.fit(X, y)
            result.mae  = round(float(np.mean(mae_scores)),  3)
            result.rmse = round(float(np.mean(rmse_scores)), 3)

            history   = series.copy()
            last_date = series.index[-1]

            for step in range(1, horizon + 1):
                forecast_date = last_date + pd.Timedelta(days=step)
                temp_series   = pd.concat([
                    history,
                    pd.Series([np.nan], index=[forecast_date])
                ])
                temp_df = self.fe.build_features(temp_series)
                row     = temp_df.iloc[[-1]][self.feature_cols].fillna(0)

                bootstrap_preds = np.maximum(
                    [tree.predict(row.values)[0] for tree in self.model.estimators_], 0
                )

                result.forecast_dates.append(str(forecast_date.date()))
                result.predicted_qty.append(round(float(np.mean(bootstrap_preds)), 3))
                result.lower_bound.append(round(float(np.percentile(bootstrap_preds, 10)), 3))
                result.upper_bound.append(round(float(np.percentile(bootstrap_preds, 90)), 3))

                history = pd.concat([
                    history,
                    pd.Series([float(np.mean(bootstrap_preds))], index=[forecast_date])
                ])

            result.success = True

        except Exception as e:
            result.error = f'Random Forest forecast failed: {e}'
            logger.exception(result.error)

        return result


class SARIMAForecaster:
    MIN_TRAINING_DAYS = 90

    def forecast(self, series, horizon=30):
        result = ForecastResult(model_type='sarima')

        if len(series) < self.MIN_TRAINING_DAYS:
            result.error = f'SARIMA needs at least {self.MIN_TRAINING_DAYS} days'
            return result

        try:
            from statsmodels.tsa.statespace.sarimax import SARIMAX

            series = series.asfreq('D').ffill().fillna(0)
            train  = series.iloc[:-30]
            val    = series.iloc[-30:]

            fit = SARIMAX(train, order=(1,1,1), seasonal_order=(1,1,0,7),
                          enforce_stationarity=False,
                          enforce_invertibility=False).fit(disp=False, maxiter=100)

            val_preds   = np.maximum(fit.forecast(steps=30).values, 0)
            result.mae  = round(float(mean_absolute_error(val.values, val_preds)), 3)
            result.rmse = round(float(np.sqrt(mean_squared_error(val.values, val_preds))), 3)

            full_fit     = SARIMAX(series, order=(1,1,1), seasonal_order=(1,1,0,7),
                                   enforce_stationarity=False,
                                   enforce_invertibility=False).fit(disp=False, maxiter=100)
            forecast_obj = full_fit.get_forecast(steps=horizon)
            pred_mean    = forecast_obj.predicted_mean
            conf_int     = forecast_obj.conf_int(alpha=0.2)

            future_dates = pd.date_range(
                start=series.index[-1] + pd.Timedelta(days=1),
                periods=horizon, freq='D'
            )

            result.forecast_dates = [str(d.date()) for d in future_dates]
            result.predicted_qty  = [round(max(float(v), 0), 3) for v in pred_mean]
            result.lower_bound    = [round(max(float(v), 0), 3) for v in conf_int.iloc[:, 0]]
            result.upper_bound    = [round(max(float(v), 0), 3) for v in conf_int.iloc[:, 1]]
            result.success        = True

        except Exception as e:
            result.error = f'SARIMA forecast failed: {e}'
            logger.exception(result.error)

        return result


class ForecastingEngine:
    RF_WEIGHT     = 0.6
    SARIMA_WEIGHT = 0.4

    def __init__(self):
        self.rf     = RandomForestForecaster()
        self.sarima = SARIMAForecaster()

    def run(self, series, horizon=30):
        results = {}

        rf_result     = self.rf.forecast(series, horizon)
        sarima_result = self.sarima.forecast(series, horizon)

        results['random_forest'] = rf_result
        results['sarima']        = sarima_result

        if rf_result.success and sarima_result.success:
            ensemble = ForecastResult(model_type='ensemble', success=True)
            ensemble.forecast_dates = rf_result.forecast_dates
            ensemble.predicted_qty  = [
                round(self.RF_WEIGHT * rf + self.SARIMA_WEIGHT * sa, 3)
                for rf, sa in zip(rf_result.predicted_qty, sarima_result.predicted_qty)
            ]
            ensemble.lower_bound = [
                round(self.RF_WEIGHT * rf + self.SARIMA_WEIGHT * sa, 3)
                for rf, sa in zip(rf_result.lower_bound, sarima_result.lower_bound)
            ]
            ensemble.upper_bound = [
                round(self.RF_WEIGHT * rf + self.SARIMA_WEIGHT * sa, 3)
                for rf, sa in zip(rf_result.upper_bound, sarima_result.upper_bound)
            ]
            ensemble.mae  = round(self.RF_WEIGHT * rf_result.mae  + self.SARIMA_WEIGHT * sarima_result.mae,  3)
            ensemble.rmse = round(self.RF_WEIGHT * rf_result.rmse + self.SARIMA_WEIGHT * sarima_result.rmse, 3)
            results['ensemble'] = ensemble

        elif rf_result.success:
            results['ensemble'] = rf_result

        return results