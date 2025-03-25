# ## RAG Q&A Conversation With PDF Including Chat History
# import streamlit as st
# from langchain.chains import create_history_aware_retriever, create_retrieval_chain
# from langchain.chains.combine_documents import create_stuff_documents_chain
# from langchain_chroma import Chroma
# from langchain_community.chat_message_histories import ChatMessageHistory
# from langchain_core.chat_history import BaseChatMessageHistory
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain_groq import ChatGroq
# from langchain_core.runnables.history import RunnableWithMessageHistory
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.document_loaders import PyPDFLoader
# import os

# from dotenv import load_dotenv
# load_dotenv()

# os.environ['HF_TOKEN']=os.getenv("HF_TOKEN")
# embeddings=HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


# ## set up Streamlit 
# st.title("Conversational RAG With PDF uplaods and chat history")
# st.write("Upload Pdf's and chat with their content")

# ## Input the Groq API Key
# api_key=st.text_input("Enter your Groq API key:",type="password")

# ## Check if groq api key is provided
# if api_key:
#     llm=ChatGroq(groq_api_key=api_key,model_name="Gemma2-9b-It")

#     ## chat interface

#     session_id=st.text_input("Session ID",value="default_session")
#     ## statefully manage chat history

#     if 'store' not in st.session_state:
#         st.session_state.store={}

#     uploaded_files=st.file_uploader("Choose A PDf file",type="pdf",accept_multiple_files=True)
#     ## Process uploaded  PDF's
#     if uploaded_files:
#         documents=[]
#         for uploaded_file in uploaded_files:
#             temppdf=f"./temp.pdf"
#             with open(temppdf,"wb") as file:
#                 file.write(uploaded_file.getvalue())
#                 file_name=uploaded_file.name

#             loader=PyPDFLoader(temppdf)
#             docs=loader.load()
#             documents.extend(docs)

#     # Split and create embeddings for the documents
#         text_splitter = RecursiveCharacterTextSplitter(chunk_size=5000, chunk_overlap=500)
#         splits = text_splitter.split_documents(documents)
#         vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)
#         retriever = vectorstore.as_retriever()    

#         contextualize_q_system_prompt=(
#             "Given a chat history and the latest user question"
#             "which might reference context in the chat history, "
#             "formulate a standalone question which can be understood "
#             "without the chat history. Do NOT answer the question, "
#             "just reformulate it if needed and otherwise return it as is."
#         )
#         contextualize_q_prompt = ChatPromptTemplate.from_messages(
#                 [
#                     ("system", contextualize_q_system_prompt),
#                     MessagesPlaceholder("chat_history"),
#                     ("human", "{input}"),
#                 ]
#             )
        
#         history_aware_retriever=create_history_aware_retriever(llm,retriever,contextualize_q_prompt)

#         ## Answer question

#         # Answer question
#         system_prompt = (
#                 "You are an assistant for question-answering tasks. "
#                 "Use the following pieces of retrieved context to answer "
#                 "the question. If you don't know the answer, say that you "
#                 "don't know. Use three sentences maximum and keep the "
#                 "answer concise."
#                 "\n\n"
#                 "{context}"
#             )
#         qa_prompt = ChatPromptTemplate.from_messages(
#                 [
#                     ("system", system_prompt),
#                     MessagesPlaceholder("chat_history"),
#                     ("human", "{input}"),
#                 ]
#             )
        
#         question_answer_chain=create_stuff_documents_chain(llm,qa_prompt)
#         rag_chain=create_retrieval_chain(history_aware_retriever,question_answer_chain)

#         def get_session_history(session:str)->BaseChatMessageHistory:
#             if session_id not in st.session_state.store:
#                 st.session_state.store[session_id]=ChatMessageHistory()
#             return st.session_state.store[session_id]
        
#         conversational_rag_chain=RunnableWithMessageHistory(
#             rag_chain,get_session_history,
#             input_messages_key="input",
#             history_messages_key="chat_history",
#             output_messages_key="answer"
#         )

#         user_input = st.text_input("Your question:")
#         if user_input:
#             session_history=get_session_history(session_id)
#             response = conversational_rag_chain.invoke(
#                 {"input": user_input},
#                 config={
#                     "configurable": {"session_id":session_id}
#                 },  # constructs a key "abc123" in `store`.
#             )
#             st.write(st.session_state.store)
#             st.write("Assistant:", response['answer'])
#             st.write("Chat History:", session_history.messages)
# else:
#     st.warning("Please enter the GRoq API Key")
import streamlit as st
from langchain.chains import create_history_aware_retriever
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Directly set the API keys (Replace with your actual keys)
HF_TOKEN = ""
GROQ_API_KEY = ""

# Initialize embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Streamlit UI setup
st.title("Conversational RAG with PDFs and Chat History")
st.write("Upload PDFs and chat with their content.")

# Session management for chat history
session_id = st.text_input("Session ID", value="default_session")

if "store" not in st.session_state:
    st.session_state.store = {}

# File uploader
uploaded_files = st.file_uploader("Choose a PDF file", type="pdf", accept_multiple_files=True)

if GROQ_API_KEY:
    llm = ChatGroq(groq_api_key=GROQ_API_KEY, model_name="Gemma2-9b-It")

    if uploaded_files:
        documents = []
        for uploaded_file in uploaded_files:
            temp_pdf = "./temp.pdf"
            with open(temp_pdf, "wb") as file:
                file.write(uploaded_file.getvalue())

            loader = PyPDFLoader(temp_pdf)
            docs = loader.load()
            documents.extend(docs)

        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        splits = text_splitter.split_documents(documents)
        doc_texts = [doc.page_content for doc in splits]

        # Compute embeddings
        doc_embeddings = np.array([embedding_model.encode(text) for text in doc_texts])

        # Initialize FAISS index
        embedding_dim = doc_embeddings.shape[1]
        index = faiss.IndexFlatL2(embedding_dim)
        index.add(doc_embeddings)

        def retrieve_relevant_chunks(query, top_k=3):
            """Retrieve top-k relevant chunks based on FAISS cosine similarity."""
            query_embedding = embedding_model.encode(query).reshape(1, -1)
            _, top_indices = index.search(query_embedding, top_k)
            return [doc_texts[i] for i in top_indices[0]]

        # Conversational Retrieval
        system_prompt = (
            "You are an assistant for question-answering tasks. "
            "Use the following retrieved context to answer the question. "
            "If you don't know the answer, say that you don't know. "
            "Use three sentences maximum and keep the answer concise.\n\n"
            "{context}"
        )

        def answer_query(user_query):
            """Retrieve context and generate answer."""
            context = retrieve_relevant_chunks(user_query)
            final_prompt = system_prompt.format(context="\n".join(context)) + f"\nQuestion: {user_query}"
            return llm.invoke(final_prompt)

        # Chat history management
        def get_session_history(session: str) -> BaseChatMessageHistory:
            if session not in st.session_state.store:
                st.session_state.store[session] = ChatMessageHistory()
            return st.session_state.store[session]

        user_input = st.text_input("Your question:")
        if user_input:
            session_history = get_session_history(session_id)
            response = answer_query(user_input)

            st.write("Assistant:", response)
            session_history.add_message(("human", user_input))
            session_history.add_message(("ai", response))

            st.write("Chat History:", session_history.messages)
else:
    st.warning("Groq API Key is missing!")
