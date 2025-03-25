import streamlit as st
import torch
from torchvision import transforms
from diffusers import StableDiffusionPipeline
import cv2
import mediapipe as mp
from PIL import Image
import numpy as np

# Set up Stable Diffusion for clothing design generation
@st.cache_resource
def load_stable_diffusion():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
    pipe = pipe.to(device)
    return pipe

pipe = load_stable_diffusion()

# Set up MediaPipe for virtual try-on
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

# Function to generate clothing designs using Stable Diffusion
def generate_design(prompt):
    with torch.autocast("cuda" if torch.cuda.is_available() else "cpu"):
        image = pipe(prompt).images[0]
    return image

# Function to overlay design on the user's body (virtual try-on)
def virtual_try_on(user_image, design_image):
    user_image = np.array(user_image)
    design_image = np.array(design_image)

    # Resize design to fit the user's body
    design_image = cv2.resize(design_image, (user_image.shape[1], user_image.shape[0]))

    # Detect pose landmarks
    results = pose.process(cv2.cvtColor(user_image, cv2.COLOR_BGR2RGB))
    if results.pose_landmarks:
        # Overlay design on the user's body
        for landmark in results.pose_landmarks.landmark:
            x, y = int(landmark.x * user_image.shape[1]), int(landmark.y * user_image.shape[0])
            user_image[y:y+design_image.shape[0], x:x+design_image.shape[1]] = design_image
    return user_image

# Streamlit app
def main():
    st.title("👗 AI Fashion Designer")
    st.write("Design your own clothing and try it on virtually!")

    # User input for the design prompt
    prompt = st.text_input("Enter a prompt for your design (e.g., 'a futuristic jacket'):")

    if st.button("Generate Design"):
        if prompt:
            with st.spinner("Generating your design..."):
                # Step 1: Generate clothing design
                design = generate_design(prompt)
                st.image(design, caption="Generated Design", use_column_width=True)

                # Step 2: Allow virtual try-on
                st.write("### Virtual Try-On")
                uploaded_file = st.file_uploader("Upload a photo of yourself to try on the design:", type=["jpg", "png", "jpeg"])
                if uploaded_file is not None:
                    user_image = Image.open(uploaded_file)
                    st.image(user_image, caption="Uploaded Photo", use_column_width=True)

                    with st.spinner("Applying virtual try-on..."):
                        try_on_image = virtual_try_on(user_image, design)
                        st.image(try_on_image, caption="Virtual Try-On", use_column_width=True)
        else:
            st.warning("Please enter a prompt to generate a design.")

# Run the app
if __name__ == "__main__":
    main()