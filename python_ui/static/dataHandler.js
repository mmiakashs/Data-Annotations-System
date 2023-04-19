class DataHandler {
    constructor() {
        this.clear();
    }

    clear() {
        this.subject = null;
        this.session = null;
        this.frames = [];
        this.currentFrame = 0;
        this.numFrames = 0;
    }

    loadNewSession(subject, session, numFrames){
        this.subject = subject;
        this.session = session;
        this.numFrames = numFrames;
        this.frames = [];
        for(let i = 0; i < numFrames; i++){
            this.frames.push(null);
        }
    }

    addFrame(idx, frame) {
        this.frames[idx] = frame;
        if(this.isReady()){
            this.drawCurrentFrame();
        }
    }

    drawCurrentFrame(){
        let frame = this.frames[this.currentFrame];

        // Set the ego image
        let displayScale = getDisplayScale(frame.ego_height);
        drawImage(frame.ego_filepath, frame.ego_width * displayScale, frame.ego_height * displayScale, doodleEgo, canvasEgo, ctxEgo);
        
        // Set the exo image
        displayScale = getDisplayScale(frame.exo_height);
        drawImage(frame.exo_filepath, frame.exo_width * displayScale, frame.exo_height * displayScale, doodleExo, canvasExo, ctxExo);

        frameInfoLabel.innerHTML = "<b>Currently Annotating Frame " + (this.currentFrame + 1) + " / " + this.numFrames + "</b>";
        transcriptionInput.value = frame.transcription;
        audioSource.src = frame.audio_filepath;
        audioElement.load();

        // jsonFile.disabled = false;
        generateJSONButton.disabled = false;
        spatialRelationshipDiv.hidden = false;
        perspectiveDiv.hidden = false;
        transcriptionDiv.hidden = false;
        referenceObjectCheckboxDiv.hidden = false;
        frameInfoDiv.hidden = false;

        spatialRelationshipInput.value = "";
        annotationHandler.resetAllAnnotatedObjects();
        annotationHandler.loadSavedAnnotations();
    }

    isReady() {
        for(let i = 0; i < this.numFrames; i++){
            if(this.frames[i] == null){
                return false;
            }
        }
        return true;
    }

    getFrame(idx) {
        return this.frames[idx];
    }
    
    getCurrentFrame() {
        return this.frames[this.currentFrame];
    }

    moveToNextFrame() {
        if(this.currentFrame < this.numFrames - 1){
            annotationHandler.saveObjectsToAnnotationHistory();
            this.currentFrame++;
            this.drawCurrentFrame();
            return true;
        }
        return false;
    }

    moveToPrevFrame() {
        if(this.currentFrame > 0){
            annotationHandler.saveObjectsToAnnotationHistory();
            this.currentFrame--;
            this.drawCurrentFrame();
            return true;
        }
        return false;
    }

}

function getDisplayScale(original_height){
    return config.frameDisplayHeight / original_height;
}

function drawImage(filepath, img_width, img_height, doodle, canvas, ctx){
    const img = document.createElement("img");
    img.src = filepath;

    img.onload = function(){
        img.width = img_width;
        img.height = img_height;
        initializeCanvasDimensions(doodle, canvas, img.width, img.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);
    }
}
