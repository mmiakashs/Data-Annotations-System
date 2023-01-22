# Data-Annotations-System

## Overview

This project is a data annotations tool meant to be used for CRL research. It is not designed to be used outside of CRL research.

This project splits data annotation into two steps:
1. Running `preprocess.py` to use the the OpenAI Whisper model to generate transcriptions of input videos and extract them into frames.
    - This step looks at all the videos in the `../videos` folder (path can be changed in `preprocess.py`) ending in .mp4 and outputs the `transcriptions.json` file and extracts the frames to a corresponding zip file in frame_extractions/.
2. Using an HTML / JavaScript UI to manually annotate the frame data and generate an output JSON.

## Installation

Before using the tool, you need to first install the python libraries used in `preprocess.py`,  [Whisper](https://github.com/openai/whisper) and [OpenCV](https://opencv.org/).

```
pip3 install -U openai-whisper # Install Whisper
pip3 install opencv-python # Install OpenCV
```

Also ensure that you have ffmpeg installed since it is necessary for whisper to run. The download for ffmpeg can be found [here](https://ffmpeg.org/download.html).

## Usage

The tool is split into two steps: **preprocessing** and **annotation.**

### Preprocessing

The preprocessing script is used to extract frames from the input video as well as extract an audio transcription of the video. This transcription will later be editable.

For the preprocessing, you should use the `preprocess.py` script in the repo. At the top of the script, there are some parameters that you can change. These parameters are:
- **VIDEOS_FOLDER:** The folder in which the video files are located.
- **VIDEO_ENDING:** The video formats that should be accepted by the script. Usually this is just the `.mp4` format.
- **MODEL_NAME:** The whisper [model](https://github.com/openai/whisper) to use to generate the audio transcription. By default this is `base.en`.
- **FRAME_EXTRACTIONS_FOLDER:** The folder to which the extracted video frames zip file should be saved.
- **OUTPUT_JSON_FILENAME:** The filename of the JSON file to which the video transcriptions are saved.
- **USING_CUDA:** Whether or not the whisper model is using the CUDA version or the CPU version of PyTorch.

### Annotation

The annotation UI allows you to draw bounding boxes around the target and reference objects, as well as label various characteristics such as their name, shape, color, and location. The UI also enables you to edit the auto-generated video transcription. The UI has been tested to work on Chrome and Firefox.

The annotation UI is located in the `annotations_ui` folder. After cloning the repo, you should be able to open up the annotations_ui/index.html file in your browser. Here, you can first upload the transcriptions JSON file that the preprocessing script generated (which is named based on the **OUTPUT_JSON_FILENAME** parameter). This JSON file only has to be uploaded one time for the entire usage of the tool. Then upload the extracted frames zip for the video you want to annotate.

Each video has two bounding boxes: The target bounding box and the reference bounding box. If the verbal message does not contain a reference object then annotate any nearby object as the reference object. The bounding boxes can be drawn or redrawn using the **Draw Annotation** button in the object's labeling section. The target bounding box will appear as green and the reference bounding box will appear as red. The tool uses **Optical Flow** to automatically track your bounding boxes across frames, so once you draw both bounding boxes all you have to do is hit Play and allow the bounding boxes to be generated for each frame.

Tip: Use the spacebar to play/pause the video, and the left and right arrows to navigate frame by frame.

Additionally, the tool displays the auto-generated transcription and allows you to make any manual corrections. You can also optionally specify a spatial relationship between the target and reference object.

Once you have drawn both bounding boxes and updated the annotation information, click the **Generate** button to save the bounding box and annotation information to an output JSON file. When you upload a new frames extraction, the annotation information and bounding boxes should reset.
