"""
Anomaly Detection Engine
─────────────────────────
Uses Isolation Forest to detect unusual daily sales patterns.
Scores each anomaly by severity and classifies as spike or drop.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


def detect_anomalies(df: pd.DataFrame, contamination: float = 0.05) -> pd.DataFrame:
    """
    Input:  DataFrame with columns [date, product_sku, store_code, daily_qty, daily_revenue]
    Output: Same DataFrame with added columns [anomaly, anomaly_score, severity, direction]
    """
    results = []

    for (sku, store), group in df.groupby(['product_sku', 'store_code']):
        group = group.sort_values('date').copy()

        if len(group) < 14:
            group['anomaly']       = False
            group['anomaly_score'] = 0.0
            group['severity']      = 'normal'
            group['direction']     = None
            results.append(group)
            continue

        # ── Feature engineering ──
        group['rolling_mean_7']  = group['daily_qty'].rolling(7, min_periods=1).mean().shift(1)
        group['rolling_std_7']   = group['daily_qty'].rolling(7, min_periods=1).std().shift(1).fillna(1)
        group['rolling_mean_14'] = group['daily_qty'].rolling(14, min_periods=1).mean().shift(1)
        group['lag_1']           = group['daily_qty'].shift(1)
        group['lag_7']           = group['daily_qty'].shift(7)
        group['dow']             = pd.to_datetime(group['date']).dt.dayofweek
        group['z_score']         = (
            (group['daily_qty'] - group['rolling_mean_7']) /
            group['rolling_std_7'].clip(lower=0.1)
        )

        features = ['daily_qty', 'rolling_mean_7', 'rolling_mean_14',
                    'lag_1', 'lag_7', 'dow', 'z_score']

        feat_df = group[features].fillna(0)

        scaler   = StandardScaler()
        X_scaled = scaler.fit_transform(feat_df)

        model = IsolationForest(
            n_estimators  = 100,
            contamination = contamination,
            random_state  = 42,
        )
        preds  = model.fit_predict(X_scaled)        # -1 = anomaly, 1 = normal
        scores = model.decision_function(X_scaled)  # lower = more anomalous

        group['anomaly']       = preds == -1
        group['anomaly_score'] = np.round(1 - (scores - scores.min()) /
                                 (scores.max() - scores.min() + 1e-9), 3)

        # Severity bands
        def get_severity(row):
            if not row['anomaly']:
                return 'normal'
            if row['anomaly_score'] >= 0.85:
                return 'critical'
            if row['anomaly_score'] >= 0.70:
                return 'high'
            return 'medium'

        # Direction: spike or drop vs rolling mean
        def get_direction(row):
            if not row['anomaly']:
                return None
            return 'spike' if row['daily_qty'] > row['rolling_mean_7'] else 'drop'

        group['severity']  = group.apply(get_severity,  axis=1)
        group['direction'] = group.apply(get_direction, axis=1)

        results.append(group)

    return pd.concat(results, ignore_index=True) if results else pd.DataFrame()