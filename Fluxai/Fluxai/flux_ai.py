import fal_client
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
fal_api_key = os.getenv("FAL_API_KEY")
if not fal_api_key:
    raise ValueError("FAL_API_KEY environment variable not set. Please add it to your .env file.")

# Configure fal_client with the API key
fal_client.api_key = fal_api_key

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/flux/dev",
    arguments={
        "prompt": "A picture of a formula 1 car"
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)