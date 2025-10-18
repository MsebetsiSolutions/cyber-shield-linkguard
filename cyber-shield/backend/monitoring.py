import requests

def access_splunk_home(splunk_url, username, password):
    """Fetch Splunk logs from the server."""
    splunk_url = splunk_url.strip()
    if not splunk_url.startswith("https://"):
        splunk_url = "https://" + splunk_url

    # Example Splunk search query
    search_query = {
        "search": "search index=_internal | head 10",  # Adjust this query based on your Splunk setup
        "exec_mode": "blocking",
    }
    auth = (username, password)
    search_url = f"{splunk_url}/services/search/jobs"

    try:
        response = requests.post(search_url, auth=auth, verify=False, data=search_query)
        if response.status_code == 201:  # HTTP Created for a successful job
            return response.text
        else:
            raise ValueError(f"Failed to fetch logs. HTTP Status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Request Error: {str(e)}")
