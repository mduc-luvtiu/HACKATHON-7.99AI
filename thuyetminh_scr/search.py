from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import torch
from open_clip import create_model_and_transforms, get_tokenizer
from deep_translator import GoogleTranslator

def search_by_text(text_query, frame_paths, features, model_name="ViT-B-32", device="cuda" if torch.cuda.is_available() else "cpu"):
    # Bước 1: Dịch tiếng Việt sang tiếng Anh
    try:
        translated = GoogleTranslator(source='vi', target='en').translate(text_query)
        print(f"[Dịch] \"{text_query}\" → \"{translated}\"")
    except Exception as e:
        print("Lỗi dịch tự động, dùng nguyên bản:", e)
        translated = text_query

    # Bước 2: Load mô hình CLIP và tokenizer
    model, _, preprocess = create_model_and_transforms(model_name, pretrained='laion2b_s34b_b79k')
    tokenizer = get_tokenizer(model_name)
    model = model.to(device).eval()

    # Bước 3: Encode văn bản
    with torch.no_grad():
        tokens = tokenizer([translated]).to(device)
        text_feat = model.encode_text(tokens).squeeze().cpu().numpy()

    # Bước 4: Tính độ tương đồng và trả về frame phù hợp
    sims = cosine_similarity([text_feat], features)[0]
    top_idx = np.argmax(sims)
    return frame_paths[top_idx], sims[top_idx]
