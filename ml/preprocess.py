"""
Preprocessing dan aturan ambang batas kelayakan air.
Dipakai bersama oleh training script dan backend API supaya konsisten.
"""
import pandas as pd

FEATURES = [
    "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
    "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity",
]

# Ambang batas indikatif (acuan WHO / Permenkes 492/2010) — dipakai untuk
# rule-based context engine, independen dari model ML, sebagai lapisan
# penjelasan yang mudah dibaca orang awam.
THRESHOLDS = {
    "ph": (6.5, 8.5),
    "Turbidity": (None, 5.0),          # NTU, maksimum
    "Sulfate": (None, 250.0),          # mg/L, maksimum
    "Chloramines": (None, 4.0),        # mg/L, maksimum
    "Trihalomethanes": (None, 80.0),   # µg/L, maksimum
}


def load_and_clean(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    # imputasi median per kolom fitur — konsisten dipakai saat training & inference
    for col in FEATURES:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    return df


def rule_based_status(reading: dict) -> dict:
    """Evaluasi cepat berbasis ambang batas, per-parameter. Ini yang membuat
    sistem 'context-aware': keputusan bukan hanya angka, tapi status yang
    langsung bisa dipahami dan disertai alasan."""
    issues = []
    for param, (low, high) in THRESHOLDS.items():
        val = reading.get(param)
        if val is None:
            continue
        if low is not None and val < low:
            issues.append(f"{param} terlalu rendah ({val:.2f}, minimum {low})")
        if high is not None and val > high:
            issues.append(f"{param} melebihi batas aman ({val:.2f}, maksimum {high})")
    return {
        "layak_rule_based": len(issues) == 0,
        "alasan": issues,
    }
