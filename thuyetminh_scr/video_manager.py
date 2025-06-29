import os
import json
import time
from pathlib import Path
from datetime import datetime
import shutil


class VideoManager:
    def __init__(self, base_dir="video_data", clear_on_start=True):
        self.base_dir = Path(base_dir)
        self.videos_dir = self.base_dir / "videos"
        self.transformed_dir = self.base_dir / "transformed"
        self.metadata_file = self.base_dir / "video_metadata.json"

        # Xóa hết file cũ nếu clear_on_start = True
        if clear_on_start:
            self.clear_all_data()

        # Tạo thư mục mới
        self.videos_dir.mkdir(parents=True, exist_ok=True)
        self.transformed_dir.mkdir(parents=True, exist_ok=True)

        # Load metadata (sẽ trống nếu clear_on_start = True)
        self.metadata = self.load_metadata()

    def clear_all_data(self):
        """Xóa hết dữ liệu cũ"""
        print("Clearing old data...")

        # Xóa thư mục video_data nếu tồn tại
        if self.base_dir.exists():
            shutil.rmtree(self.base_dir)
            print(f"Deleted directory: {self.base_dir}")

        # Xóa thư mục videos gốc
        original_videos_dir = Path("videos")
        if original_videos_dir.exists():
            shutil.rmtree(original_videos_dir)
            print(f"Deleted directory: {original_videos_dir}")

        # Xóa thư mục video_transform gốc
        original_transform_dir = Path("video_transform")
        if original_transform_dir.exists():
            shutil.rmtree(original_transform_dir)
            print(f"Deleted directory: {original_transform_dir}")

        # Xóa thư mục audio
        audio_dir = Path("audio")
        if audio_dir.exists():
            shutil.rmtree(audio_dir)
            print(f"Deleted directory: {audio_dir}")

        # Xóa thư mục voice_segments
        voice_segments_dir = Path("voice_segments")
        if voice_segments_dir.exists():
            shutil.rmtree(voice_segments_dir)
            print(f"Deleted directory: {voice_segments_dir}")

        # Xóa thư mục rag_chatbot
        rag_chatbot_dir = Path("rag_chatbot")
        if rag_chatbot_dir.exists():
            shutil.rmtree(rag_chatbot_dir)
            print(f"Deleted directory: {rag_chatbot_dir}")

        # Xóa file metadata
        if self.metadata_file.exists():
            self.metadata_file.unlink()
            print(f"Deleted file: {self.metadata_file}")

        # Xóa file voice_segments_metadata.json
        voice_metadata_file = Path("voice_segments_metadata.json")
        if voice_metadata_file.exists():
            voice_metadata_file.unlink()
            print(f"Deleted file: {voice_metadata_file}")

        print("Finished clearing old data!")

    def load_metadata(self):
        """Load metadata từ file JSON"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def save_metadata(self):
        """Lưu metadata vào file JSON"""
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)

    def add_video(self, video_path, youtube_url, title=None, voice=None):
        """Thêm video gốc vào hệ thống"""
        if not Path(video_path).exists():
            return None

        # Tạo ID duy nhất cho video
        video_id = f"video_{int(time.time())}"

        # Lấy thông tin file
        file_path = Path(video_path)
        file_size = file_path.stat().st_size
        created_time = datetime.fromtimestamp(file_path.stat().st_mtime)

        # Tạo tên file mới
        new_filename = f"{video_id}_{file_path.name}"
        new_path = self.videos_dir / new_filename

        # Copy file vào thư mục videos
        shutil.copy2(video_path, new_path)

        # Lưu metadata
        self.metadata[video_id] = {
            "id": video_id,
            "title": title or file_path.stem,
            "youtube_url": youtube_url,
            "original_path": str(new_path),
            "file_size": file_size,
            "created_time": created_time.isoformat(),
            "voice": voice,
            "transformed_path": None,
            "status": "original_only"
        }

        self.save_metadata()
        return video_id

    def add_transformed_video(self, video_id, transformed_path, voice):
        """Thêm video đã thuyết minh vào hệ thống"""
        if video_id not in self.metadata:
            return False

        if not Path(transformed_path).exists():
            return False

        # Lấy thông tin file
        file_path = Path(transformed_path)
        file_size = file_path.stat().st_size

        # Tạo tên file mới
        new_filename = f"{video_id}_transformed_{voice}_{file_path.name}"
        new_path = self.transformed_dir / new_filename

        # Copy file vào thư mục transformed
        shutil.copy2(transformed_path, new_path)

        # Cập nhật metadata
        self.metadata[video_id]["transformed_path"] = str(new_path)
        self.metadata[video_id]["voice"] = voice
        self.metadata[video_id]["status"] = "completed"
        self.metadata[video_id]["transformed_size"] = file_size
        self.metadata[video_id]["transformed_time"] = datetime.now().isoformat()

        self.save_metadata()
        return True

    def get_video_info(self, video_id):
        """Lấy thông tin video theo ID"""
        return self.metadata.get(video_id)

    def get_all_videos(self):
        """Lấy danh sách tất cả video"""
        return list(self.metadata.values())

    def get_latest_video(self):
        """Lấy video mới nhất"""
        if not self.metadata:
            return None

        # Sắp xếp theo thời gian tạo, lấy video mới nhất
        latest = max(self.metadata.values(), key=lambda x: x["created_time"])
        return latest

    def get_video_by_status(self, status):
        """Lấy video theo trạng thái"""
        return [v for v in self.metadata.values() if v["status"] == status]

    def delete_video(self, video_id):
        """Xóa video và metadata"""
        if video_id not in self.metadata:
            return False

        video_info = self.metadata[video_id]

        # Xóa file trong hệ thống quản lý
        if video_info["original_path"] and Path(video_info["original_path"]).exists():
            Path(video_info["original_path"]).unlink()

        if video_info["transformed_path"] and Path(video_info["transformed_path"]).exists():
            Path(video_info["transformed_path"]).unlink()

        # Xóa metadata
        del self.metadata[video_id]
        self.save_metadata()

        return True

    def get_video_paths(self, video_id):
        """Lấy đường dẫn file video gốc và đã thuyết minh"""
        if video_id not in self.metadata:
            return None, None

        video_info = self.metadata[video_id]
        original_path = video_info["original_path"]
        transformed_path = video_info.get("transformed_path")

        return original_path, transformed_path

    def get_video_bytes(self, video_id, video_type="original"):
        """Lấy bytes của video để hiển thị trong Streamlit"""
        if video_id not in self.metadata:
            return None

        video_info = self.metadata[video_id]

        if video_type == "original":
            file_path = video_info["original_path"]
        elif video_type == "transformed":
            file_path = video_info.get("transformed_path")
        else:
            return None

        if not file_path or not Path(file_path).exists():
            return None

        try:
            with open(file_path, "rb") as f:
                return f.read()
        except:
            return None

    def get_video_stats(self):
        """Lấy thống kê video"""
        total_videos = len(self.metadata)
        completed_videos = len(
            [v for v in self.metadata.values() if v["status"] == "completed"])
        original_only = len(
            [v for v in self.metadata.values() if v["status"] == "original_only"])

        total_size = sum(v["file_size"] for v in self.metadata.values())
        transformed_size = sum(v.get("transformed_size", 0)
                               for v in self.metadata.values() if v.get("transformed_size"))

        return {
            "total_videos": total_videos,
            "completed_videos": completed_videos,
            "original_only": original_only,
            "total_size_mb": total_size / (1024 * 1024),
            "transformed_size_mb": transformed_size / (1024 * 1024)
        }


# Tạo instance global với clear_on_start=True
video_manager = VideoManager(clear_on_start=True)
