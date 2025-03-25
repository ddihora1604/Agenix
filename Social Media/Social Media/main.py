import streamlit as st
import os
from dotenv import load_dotenv
from groq import Groq
from datetime import datetime

# Load environment variables from .env file
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Ensure API key is available
if not GROQ_API_KEY:
    st.error("Missing Groq API key. Set it in a .env file.")
    st.stop()

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)

# Initialize session state for scheduled posts
if "scheduled_posts" not in st.session_state:
    st.session_state.scheduled_posts = []

# Function to schedule posts
def schedule_post(platform, content, schedule_time):
    st.session_state.scheduled_posts.append({
        "platform": platform,
        "content": content,
        "schedule_time": schedule_time
    })

# Function to generate AI content using Groq
def generate_ai_response(prompt):
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="mixtral-8x7b-32768",
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error: {str(e)}"

# Streamlit App
st.title("📱 Social Media Management Tool")

# Sidebar for navigation
feature = st.sidebar.selectbox(
    "Select Feature",
    ["Post Scheduler", "Engagement Analytics", "Content Suggestions", 
     "Hashtag Suggestions", "Trend Detection", "Competitor Analysis"]
)

# Feature 1: Post Scheduler
if feature == "Post Scheduler":
    st.header("📅 Post Scheduler")

    platform = st.selectbox("Select Platform", ["Twitter", "Instagram", "Facebook", "LinkedIn"])
    content = st.text_area("Post Content")

    # Date & Time input
    schedule_date = st.date_input("Schedule Date")
    schedule_time = st.time_input("Schedule Time")

    # Ensure valid date-time before scheduling
    if st.button("Schedule Post"):
        if content and schedule_date and schedule_time:
            schedule_datetime = datetime.combine(schedule_date, schedule_time)
            schedule_post(platform, content, schedule_datetime)
            st.success(f"✅ Post scheduled for {platform} at {schedule_datetime}!")
        else:
            st.error("❌ Please provide valid content, date, and time.")

    # Display scheduled posts
    st.subheader("📝 Scheduled Posts")
    if st.session_state.scheduled_posts:
        for post in st.session_state.scheduled_posts:
            st.write(f"📌 **{post['platform']}** | 🕒 {post['schedule_time']}\n📝 {post['content']}")
    else:
        st.info("No posts scheduled yet.")

# Feature 2: Engagement Analytics
elif feature == "Engagement Analytics":
    st.header("📊 Engagement Analytics")

    post_content = st.text_area("Enter the post content to analyze engagement")

    if st.button("Analyze Engagement"):
        if post_content:
            prompt = f"Analyze the engagement metrics (likes, shares, comments) for this post:\n\n{post_content}"
            engagement_data = generate_ai_response(prompt)
            st.write("📈 **Engagement Metrics:**")
            st.write(engagement_data)
        else:
            st.error("❌ Please enter post content.")

# Feature 3: Content Suggestions
elif feature == "Content Suggestions":
    st.header("💡 Content Suggestions")

    topic = st.text_input("Enter a topic for post ideas")

    if st.button("Generate Content"):
        if topic:
            prompt = f"Generate 3 post ideas and captions for {topic}. Suggest 5 relevant hashtags for each."
            content = generate_ai_response(prompt)
            st.write("📝 **Generated Content and Hashtags:**")
            st.write(content)
        else:
            st.error("❌ Please enter a topic.")

# Feature 4: Hashtag Suggestions
elif feature == "Hashtag Suggestions":
    st.header("🏷️ Hashtag Suggestions")

    topic = st.text_input("Enter a topic for hashtag suggestions")

    if st.button("Generate Hashtags"):
        if topic:
            prompt = f"Generate 10 relevant hashtags for the topic: {topic}"
            hashtags = generate_ai_response(prompt)
            st.write("🔖 **Generated Hashtags:**")
            st.write(hashtags)
        else:
            st.error("❌ Please enter a topic.")

# Feature 5: Trend Detection
elif feature == "Trend Detection":
    st.header("📢 Trend Detection")

    if st.button("Detect Trends"):
        prompt = "Generate 3 trending topics and hashtags for social media in 2024. Provide a brief explanation for each trend."
        trends = generate_ai_response(prompt)
        st.write("🔥 **Trending Topics and Hashtags:**")
        st.write(trends)

# Feature 6: Competitor Analysis
elif feature == "Competitor Analysis":
    st.header("🏆 Competitor Analysis")

    if st.button("Compare Performance"):
        prompt = "Generate a realistic comparison of social media performance for 3 competitors. Include followers, engagement rate, and post frequency."
        competitor_data = generate_ai_response(prompt)
        st.write("📊 **Competitor Performance:**")
        st.write(competitor_data)
