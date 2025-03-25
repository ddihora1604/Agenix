from groq import Groq
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Groq client
groq_api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=groq_api_key)

def generate_hashtags(topic):
    prompt = f"Generate 10 relevant hashtags for the topic: {topic}"
    hashtags = generate_content(prompt)
    return hashtags

def hashtag_suggestions_feature():
    st.header("Hashtag Suggestions")

    # Input field for topic
    topic = st.text_input("Enter a topic for hashtag suggestions")

    # Generate hashtags button
    if st.button("Generate Hashtags"):
        if topic:
            hashtags = generate_hashtags(topic)
            st.write("Generated Hashtags:")
            st.write(hashtags)
        else:
            st.error("Please enter a topic.")