class SessionHandler {
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
            console.log(this);
            this.setCanvasFrame(this.currentFrame);
        }
    }

    setCanvasFrame(idx){
        let frame = this.frames[idx];

        // Set the ego image
        let displayScale = getDisplayScale(frame.ego_height);
        drawImage(frame.ego_filepath, displayScale * frame.ego_width, config.frameDisplayHeight, doodleEgo, canvasEgo, ctxEgo);
        
        // Set the exo image
        displayScale = getDisplayScale(frame.exo_height);
        drawImage(frame.exo_filepath, displayScale * frame.exo_width, config.frameDisplayHeight, doodleExo, canvasExo, ctxExo);

        // // Set the ego image
        // let displayScale = getDisplayScale(frame.ego_width);
        // drawImage(frame.ego_filepath, config.frameDisplayWidth, displayScale * frame.ego_height, doodleEgo, canvasEgo, ctxEgo);
        
        // // Set the exo image
        // displayScale = getDisplayScale(frame.exo_width);
        // drawImage(frame.exo_filepath, config.frameDisplayWidth, displayScale * frame.exo_height, doodleExo, canvasExo, ctxExo);


        // jsonFile.disabled = false;
        generateJSONButton.disabled = false;
        spatialRelationshipDiv.hidden = false;
        perspectiveDiv.hidden = false;
        transcriptionDiv.hidden = false;
        referenceObjectCheckboxDiv.hidden = false;

        spatialRelationshipInput.value = "";
        annotationHandler.resetAllAnnotatedObjects();
    }

    isReady() {
        for(let i = 0; i < this.numFrames; i++){
            if(this.frames[i] == null){
                return false;
            }
        }
        return true;
    }
    
    getCurrentFrame() {
        return this.frames[this.currentFrame];
    }

    moveToNextFrame() {
        if(this.currentFrame < this.numFrames - 1){
            this.currentFrame++;
            return true;
        }
        return false;
    }

    moveToPrevFrame() {
        if(this.currentFrame > 0){
            this.currentFrame--;
            return true;
        }
        return false;
    }

}

function getDisplayScale(original_height){
    return config.frameDisplayHeight / original_height;
// function getDisplayScale(original_width){
//     return config.frameDisplayWidth / original_width;
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

function setSelectOptions(selectQuery, optionList){
    selectQuery.find('option').remove().end();
    $.each(optionList, function (i, item) {
        selectQuery.append($('<option>', { 
            value: item.value,
            text : item.text 
        }));
    });
}