import subprocess
import sys
import os

# Set environment variable to disable agent
os.environ['START_AGENT'] = 'false'

print("Starting Flask SOC Dashboard...")
print("=" * 50)

# Start the Flask app
process = subprocess.Popen(
    [sys.executable, "app.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1,
    universal_newlines=True
)

print(f"Flask app started with PID: {process.pid}")
print("Waiting for server to start...")
print("=" * 50)

# Print output lines
try:
    for line in process.stdout:
        print(line, end='')
        if "Running on" in line:
            print("\n" + "=" * 50)
            print("✅ Server is ready!")
            print("=" * 50)
except KeyboardInterrupt:
    print("\n\nStopping Flask app...")
    process.terminate()
    process.wait()
    print("Server stopped.")
