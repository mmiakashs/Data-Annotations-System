# Data-Annotations-System

This project is a data annotations tool meant to be used for CRL research. It is not designed to be used outside of CRL research.

This project splits data annotation into two steps:
1. Running `preprocess.py` to use the the OpenAI Whisper model to generate transcriptions of input videos and extract them into frames.
    - This step looks at all the videos in the `../videos` folder (path can be changed in `preprocess.py`) ending in .mp4 and outputs the `transcriptions.json` file and extracts the frames to a corresponding zip file in frame_extractions/.
2. Using an HTML / JavaScript UI to manually annotate the frame data and generate an output JSON.