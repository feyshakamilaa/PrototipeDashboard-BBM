"""Olah CSV BBM Jatimbalinus -> data/data.json (+ data/data.js untuk dibuka langsung tanpa server)."""
import calendar, json, sys
from pathlib import Path
import pandas as pd

base = Path(__file__).parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else base / "data" / "dataset_patra_niaga_jatimbalinus_bbm_2021_2025_60baris.csv"
df = pd.read_csv(src, encoding="utf-8-sig").sort_values("periode").reset_index(drop=True)

# Validasi ringan: total harus sama dengan jumlah komponennya
prod = ["biosolar", "pertalite", "pertamax", "dexlite", "avtur"]
assert (df[[f"penerimaan_{p}_kl" for p in prod]].sum(axis=1) == df.total_penerimaan_kl).all()
assert (df[[f"penyaluran_{p}_kl" for p in prod]].sum(axis=1) == df.total_penyaluran_kl).all()

df["hari"] = [calendar.monthrange(y, m)[1] for y, m in zip(df.tahun, df.bulan)]
df = df.drop(columns=["regional", "keterangan_data", "pencapaian_target_pct", "tingkat_susut_pct",
                      "coverage_days", "biaya_per_liter_rp"])  # dihitung ulang di dashboard dari komponen

out = {"catatan": "Prototipe Akademik — Data Simulasi, Bukan Data Resmi Pertamina",
       "rows": json.loads(df.to_json(orient="records"))}
js = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
(base / "data" / "data.json").write_text(js, encoding="utf-8")
(base / "data" / "data.js").write_text("window.DATA_BBM=" + js + ";", encoding="utf-8")
print(f"OK: {len(df)} baris, {df.periode.iloc[0]} s.d. {df.periode.iloc[-1]}")
