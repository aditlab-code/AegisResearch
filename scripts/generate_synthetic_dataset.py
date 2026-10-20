import os
import random
import sys

def generate_dataset(output_path: str, num_rows: int = 500_000):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 200 columns matching IEEE-CIS style
    header = [
        "TransactionID", "isFraud", "TransactionDT", "TransactionAmt", "ProductCD",
        "card1", "card2", "card3", "card4", "card5", "card6",
        "addr1", "addr2", "dist1", "dist2", "P_emaildomain", "R_emaildomain",
    ]
    # C1..C14 (14)
    header.extend([f"C{i}" for i in range(1, 15)])
    # D1..D15 (15)
    header.extend([f"D{i}" for i in range(1, 16)])
    # M1..M9 (9)
    header.extend([f"M{i}" for i in range(1, 10)])
    # V1..V145 (145) -> total 17 + 14 + 15 + 9 + 145 = 200
    header.extend([f"V{i}" for i in range(1, 146)])
    
    assert len(header) == 200, f"Expected 200 columns, got {len(header)}"
    
    products = ["W", "C", "R", "H", "S"]
    card4_opts = ["visa", "mastercard", "discover", "american express"]
    card6_opts = ["debit", "credit"]
    emails = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "anonymous.com", ""]
    m_opts = ["T", "F", ""]
    
    chunk_size = 25_000
    total_written = 0
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(",".join(header) + "\n")
        
        while total_written < num_rows:
            batch_size = min(chunk_size, num_rows - total_written)
            lines = []
            for i in range(batch_size):
                row_id = 1_000_000 + total_written + i
                is_fraud = 1 if random.random() < 0.035 else 0
                tx_dt = 86400 + (total_written + i) * 12
                amt = round(random.uniform(5.0, 1250.0), 2)
                p_cd = random.choice(products)
                c1 = random.randint(1000, 9999)
                c2 = random.randint(100, 600)
                c3 = 150
                c4 = random.choice(card4_opts)
                c5 = random.choice([117, 126, 137, 166, 226])
                c6 = random.choice(card6_opts)
                a1 = random.randint(100, 499)
                a2 = random.choice([60, 87, 96])
                d1 = round(random.uniform(1.0, 50.0), 1) if random.random() > 0.4 else ""
                d2 = ""
                p_email = random.choice(emails)
                r_email = random.choice(emails) if random.random() > 0.5 else ""
                
                c_vals = [str(random.randint(0, 5)) for _ in range(14)]
                d_vals = [str(random.randint(0, 30)) if random.random() > 0.3 else "" for _ in range(15)]
                m_vals = [random.choice(m_opts) for _ in range(9)]
                v_vals = [str(round(random.uniform(0.0, 1.0), 3)) if random.random() > 0.2 else "" for _ in range(145)]
                
                row = [
                    str(row_id), str(is_fraud), str(tx_dt), str(amt), p_cd,
                    str(c1), str(c2), str(c3), c4, str(c5), c6,
                    str(a1), str(a2), str(d1), str(d2), p_email, r_email,
                ] + c_vals + d_vals + m_vals + v_vals
                
                lines.append(",".join(row))
                
            f.write("\n".join(lines) + "\n")
            total_written += batch_size
            print(f"Generated {total_written}/{num_rows} rows...", flush=True)

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "backend/latex_workspaces/template-thesis/assets/research_transactions.csv"
    rows = int(sys.argv[2]) if len(sys.argv) > 2 else 500_000
    print(f"Generating synthetic dataset: {rows} rows x 200 columns -> {out}")
    generate_dataset(out, rows)
    print("Done!")
