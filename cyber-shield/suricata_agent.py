"""
Enhanced Suricata EVE forwarder for Windows/Linux.

This script tails a Suricata `eve.json` file and POSTs each alert event to the SOC dashboard.
Supports both Windows and Linux paths.
"""
import argparse
import json
import time
import requests
import os
import sys
import platform
from pathlib import Path
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SuricataForwarder:
    def __init__(self, eve_file, target_url, batch_size=1, retry_interval=5):
        self.eve_file = eve_file
        self.target_url = target_url.rstrip('/') + '/api/monitoring/suricata/event'
        self.batch_size = batch_size
        self.retry_interval = retry_interval
        self.running = False
        self.backoff = 1.0
        self.max_backoff = 30.0
        
    def get_default_eve_path(self):
        """Get default eve.json path based on OS"""
        system = platform.system()
        
        if system == 'Windows':
            # Common Suricata paths on Windows
            paths = [
                r"C:\Program Files\Suricata\log\eve.json",
                r"C:\Suricata\log\eve.json",
                os.path.join(os.environ.get('PROGRAMFILES', ''), 'Suricata', 'log', 'eve.json'),
                os.path.join(os.environ.get('PROGRAMFILES(X86)', ''), 'Suricata', 'log', 'eve.json'),
            ]
        else:  # Linux/Mac
            paths = [
                '/var/log/suricata/eve.json',
                '/usr/local/var/log/suricata/eve.json',
                '/var/log/suricata/eve.json.1',
            ]
        
        for path in paths:
            if os.path.exists(path):
                logger.info(f"Found eve.json at: {path}")
                return path
        
        return None
    
    def validate_connection(self):
        """Test connection to SOC dashboard"""
        try:
            test_url = self.target_url.replace('/event', '/stats')
            response = requests.get(test_url, timeout=10)
            if response.status_code == 200:
                logger.info(f"Connected to SOC dashboard at {self.target_url}")
                return True
            else:
                logger.warning(f"Dashboard responded with status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Cannot connect to SOC dashboard: {e}")
            return False
    
    def post_events(self, events):
        """Post events to SOC dashboard with retry logic"""
        try:
            payload = events if len(events) > 1 else events[0]
            headers = {'Content-Type': 'application/json'}
            
            logger.debug(f"Posting {len(events)} events to {self.target_url}")
            response = requests.post(
                self.target_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Successfully posted {len(events)} events")
                self.backoff = 1.0  # Reset backoff on success
                return True
            else:
                logger.error(f"Failed to post events: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error posting events: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error posting events: {e}")
            return False
    
    def tail_file(self):
        """Tail the eve.json file and yield new lines"""
        file_position = 0
        
        while self.running:
            try:
                if not os.path.exists(self.eve_file):
                    logger.warning(f"eve.json not found at {self.eve_file}, waiting...")
                    time.sleep(self.retry_interval)
                    continue
                
                with open(self.eve_file, 'r', encoding='utf-8', errors='ignore') as f:
                    # Seek to last known position
                    f.seek(0, os.SEEK_END)
                    file_size = f.tell()
                    
                    if file_size < file_position:
                        # File was rotated or truncated
                        logger.info("File was rotated/truncated, resetting position")
                        file_position = 0
                    
                    if file_size > file_position:
                        # New data available
                        f.seek(file_position)
                        new_lines = f.readlines()
                        file_position = f.tell()
                        
                        for line in new_lines:
                            yield line.strip()
                    else:
                        # No new data
                        time.sleep(0.5)
                        
            except FileNotFoundError:
                logger.warning(f"File not found: {self.eve_file}")
                time.sleep(self.retry_interval)
            except PermissionError:
                logger.error(f"Permission denied accessing: {self.eve_file}")
                time.sleep(self.retry_interval)
            except Exception as e:
                logger.error(f"Error reading file: {e}")
                time.sleep(self.retry_interval)
    
    def process_events(self):
        """Main event processing loop"""
        buffer = []
        
        for line in self.tail_file():
            if not line:
                continue
            
            try:
                event = json.loads(line)
                
                # Only process alert events
                if event.get('event_type') != 'alert':
                    continue
                
                # Add timestamp if not present
                if 'timestamp' not in event:
                    event['timestamp'] = datetime.utcnow().isoformat() + 'Z'
                
                buffer.append(event)
                
                # Post when buffer reaches batch size
                if len(buffer) >= self.batch_size:
                    if self.post_events(buffer):
                        buffer = []
                    else:
                        # Failed to post, keep in buffer and retry later
                        logger.warning(f"Failed to post {len(buffer)} events, retrying in {self.backoff}s")
                        time.sleep(self.backoff)
                        self.backoff = min(self.max_backoff, self.backoff * 2)
                
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON line: {line[:100]}...")
                continue
            except Exception as e:
                logger.error(f"Error processing line: {e}")
                continue
        
        # Post any remaining events in buffer
        if buffer and self.running:
            self.post_events(buffer)
    
    def start(self):
        """Start the forwarder"""
        logger.info(f"Starting Suricata forwarder")
        logger.info(f"  Eve file: {self.eve_file}")
        logger.info(f"  Target: {self.target_url}")
        logger.info(f"  Batch size: {self.batch_size}")
        
        # Validate connection first
        if not self.validate_connection():
            logger.error("Cannot connect to SOC dashboard. Please ensure the dashboard is running.")
            return False
        
        self.running = True
        
        try:
            self.process_events()
        except KeyboardInterrupt:
            logger.info("Received interrupt, shutting down...")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            self.running = False
        
        return True

def main():
    parser = argparse.ArgumentParser(description='Suricata EVE forwarder for SOC dashboard')
    parser.add_argument('--file', '-f', dest='file', 
                       help='Path to eve.json file')
    parser.add_argument('--target', '-t', dest='target', 
                       default='http://127.0.0.1:5000',
                       help='SOC dashboard base URL')
    parser.add_argument('--batch', '-b', dest='batch', type=int,
                       default=1, help='Batch size for sending events')
    parser.add_argument('--retry', '-r', dest='retry', type=int,
                       default=5, help='Retry interval in seconds')
    
    args = parser.parse_args()
    
    # Use provided file or find default
    eve_file = args.file
    if not eve_file:
        forwarder = SuricataForwarder(None, args.target, args.batch, args.retry)
        eve_file = forwarder.get_default_eve_path()
        
        if not eve_file:
            logger.error("Could not find eve.json file. Please specify with --file")
            sys.exit(1)
    
    # Create forwarder
    forwarder = SuricataForwarder(eve_file, args.target, args.batch, args.retry)
    
    # Start forwarder
    try:
        forwarder.start()
    except KeyboardInterrupt:
        logger.info("Suricata forwarder stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()