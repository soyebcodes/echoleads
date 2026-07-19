import os
import sys
sys.path.insert(0, os.getcwd())
import main
from fastapi.testclient import TestClient

client = TestClient(main.app)
response = client.post('/run', json={'campaign_id': None})
print(response.status_code)
print(response.text)
