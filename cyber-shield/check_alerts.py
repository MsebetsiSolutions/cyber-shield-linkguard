import sqlite3

conn = sqlite3.connect('soc_dashboard.db')
cur = conn.cursor()

# Check total alerts
cur.execute('SELECT COUNT(*) FROM alerts')
total = cur.fetchone()[0]
print(f'Total alerts: {total}')

# Check sniffer alerts
cur.execute('SELECT COUNT(*) FROM alerts WHERE source = "sniffer"')
sniffer_count = cur.fetchone()[0]
print(f'Sniffer alerts: {sniffer_count}')

# Show all alerts with source
cur.execute('SELECT id, title, source FROM alerts')
rows = cur.fetchall()
print('\nAll alerts:')
for r in rows:
    print(f'  ID: {r[0]}, Title: {r[1]}, Source: {r[2]}')

conn.close()
