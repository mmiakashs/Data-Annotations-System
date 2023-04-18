
/**
 * Represents the coordinates of a bounding box
 */
class BoundingBox {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

class AnnotatedObject {
  constructor() {
    this.id = undefined;
    this.frame = undefined;
    this.label = undefined;
    this.color = undefined;
    this.shape = undefined;
    this.location = undefined;
    this.doms = {};
    this.bboxs = {};
  }
}

class AnnotationHandler {
  constructor() {
    this.annotatedObjects = [];
    this.annotationHistory = {};
    this.currentlyAnnotating = null;
  }

  saveObjectsToAnnotationHistory() {
    let frame = dataHandler.getCurrentFrame();
    let key = [frame.subject, frame.session, frame.currentFrame];
    this.annotationHistory[key] = {};
    for (let i = 0; i < this.annotatedObjects.length; i++) {
      let annotatedObject = this.annotatedObjects[i];
      this.annotationHistory[key][annotatedObject.id] = annotatedObject.doms;
    }
  }

  resetAllAnnotatedObjects() {
    for (let i = 0; i < this.annotatedObjects.length; i++) {
      let annotatedObject = this.annotatedObjects[i];
      annotatedObject.controls.remove();
      for(let j = 0; j < annotatedObject.doms.length; j++){
        $(annotatedObject.doms[j]).remove();
      }
    }
    this.annotatedObjects = [];
  
    this.createAnnotatedObject('target');
    if(referenceObjectCheckbox.checked){
      this.createAnnotatedObject('reference');
    }
    else{
      this.deleteAnnotatedObject('reference');
    }
  
    spatialRelationshipInput.text = "";
    transcriptionInput.text = "";
    perspectiveInput.value = "neutral";
  }

  createAnnotatedObject(id){
    let annotatedObject = new AnnotatedObject();
    annotatedObject.id = id;
    annotatedObject.doms = {};
    this.annotatedObjects.push(annotatedObject);
    addAnnotatedObjectControls(this, annotatedObject);
  }
  
  deleteAnnotatedObject(id) {
    for (let i = this.annotatedObjects.length - 1; i >= 0; i--) {
      let annotatedObject = this.annotatedObjects[i];
      if(annotatedObject.id == id){
        this.annotatedObjects.splice(i, 1);
        annotatedObject.controls.remove();
        Object.values(annotatedObject.doms).forEach(dom => $(dom).remove());

        if(this.currentlyAnnotating !== null && this.currentlyAnnotating.id == annotatedObject.id){
          this.stopAnnotation();        
        }
      }
    }
  }

  getAnnotatedObjectByID(id){
    for(let i = 0; i < this.annotatedObjects.length; i++){
      let annotatedObject = this.annotatedObjects[i];
      if(annotatedObject.id == id){
        return annotatedObject;
      }
    }
    return null;
  }
  
  annotateObject(id) {
    doodleEgo.style.cursor = 'crosshair';
    doodleExo.style.cursor = 'crosshair';
    this.currentlyAnnotating = this.getAnnotatedObjectByID(id);
  }

  stopAnnotation(){
    if (tmpAnnotatedObject['ego'] != null) {
      doodleEgo.removeChild(tmpAnnotatedObject['ego'].dom);
      tmpAnnotatedObject['ego'] = null;
    }
    if (tmpAnnotatedObject['exo'] != null) {
      doodleExo.removeChild(tmpAnnotatedObject['exo'].dom);
      tmpAnnotatedObject['exo'] = null;
    }


    doodleEgo.style.cursor = 'default';
    doodleExo.style.cursor = 'default';
    annotationHandler.currentlyAnnotating = null;
  }
  
}

function handleReferenceObjectCheckboxClick() {
  if(referenceObjectCheckbox.checked){
    annotationHandler.deleteAnnotatedObject('reference');
    annotationHandler.createAnnotatedObject('reference');
  }
  else{
    annotationHandler.deleteAnnotatedObject('reference');
  }
}

function newBboxElement(doodle) {
  let dom = document.createElement('div');
  dom.className = 'bbox';
  doodle.appendChild(dom);

  return dom;
}

function setupDoodle(doodle, doodleView){

  doodle.onmousemove = function (e) {
    let ev = e || window.event;
    if (ev.pageX) {
      mouse.x = ev.pageX;
      mouse.y = ev.pageY;
    } else if (ev.clientX) {
      mouse.x = ev.clientX;
      mouse.y = ev.clientY;
    }
    mouse.x -= doodle.offsetLeft;
    mouse.y -= doodle.offsetTop;

    if (tmpAnnotatedObject[doodleView] !== null) {
      tmpAnnotatedObject[doodleView].width = Math.abs(mouse.x - mouse.startX);
      tmpAnnotatedObject[doodleView].height = Math.abs(mouse.y - mouse.startY);
      tmpAnnotatedObject[doodleView].x = (mouse.x - mouse.startX < 0) ? mouse.x : mouse.startX;
      tmpAnnotatedObject[doodleView].y = (mouse.y - mouse.startY < 0) ? mouse.y : mouse.startY;

      tmpAnnotatedObject[doodleView].dom.style.width = tmpAnnotatedObject[doodleView].width + 'px';
      tmpAnnotatedObject[doodleView].dom.style.height = tmpAnnotatedObject[doodleView].height + 'px';
      tmpAnnotatedObject[doodleView].dom.style.left = tmpAnnotatedObject[doodleView].x + 'px';
      tmpAnnotatedObject[doodleView].dom.style.top = tmpAnnotatedObject[doodleView].y + 'px';
    }
  }

  doodle.onclick = function (e) {
    if (doodle.style.cursor != 'crosshair') {
      return;
    }

    if (tmpAnnotatedObject[doodleView] != null) {
      if(annotationHandler.currentlyAnnotating != null){
        let annotatedObject = annotationHandler.currentlyAnnotating;
        if(annotatedObject.doms[doodleView] !== undefined){
          doodle.removeChild(annotatedObject.doms[doodleView]);
        }
        annotatedObject.doms[doodleView] = tmpAnnotatedObject[doodleView].dom;
        let bbox = new BoundingBox(tmpAnnotatedObject[doodleView].x, tmpAnnotatedObject[doodleView].y, tmpAnnotatedObject[doodleView].width, tmpAnnotatedObject[doodleView].height);
        annotatedObject.bboxs[doodleView] = bbox;

        interactify(
          annotatedObject.dom,
          (x, y, width, height) => {
            let bbox = new BoundingBox(x, y, width, height);
            annotatedObject.bboxs[doodleView] = bbox;
          }
        );
      }
      tmpAnnotatedObject[doodleView] = null;
    } else {
      mouse.startX = mouse.x;
      mouse.startY = mouse.y;

      let dom = newBboxElement(doodle);
      dom.style.left = mouse.x + 'px';
      dom.style.top = mouse.y + 'px';
      if(annotationHandler.currentlyAnnotating.id == 'target'){
        dom.style.border = '2px solid rgba(0, 255, 0, 1)';
      }
      else{
        dom.style.border = '2px solid rgba(255, 0, 0, 1)';
      }
      tmpAnnotatedObject[doodleView] = { dom: dom };
    }
  }

}

/*
JSON-related fuctions
*/

function annotatedObjectToJSON(annotatedObject){
  let output = {};
  output.id = annotatedObject.id;
  output.label = annotatedObject.label;
  output.color = annotatedObject.color;
  output.shape = annotatedObject.shape;
  output.location = annotatedObject.location;
  output.annotations = [];

  let totalFrames = framesManager.frames.totalFrames();
  for (let frameNumber = 0; frameNumber < totalFrames; frameNumber++) {
    let annotatedFrame = annotatedObject.get(frameNumber);
    if (annotatedFrame == null) {
      window.alert('Bounding box not found for ' + output.id + ' in frame ' + toString(frameNumber) + '. Play the video in full before downloading the XML so that bounding box data is available for all frames.');
      return null;
    }

    let bbox = annotatedFrame.bbox;
    if (bbox != null) {
      let isGroundTruth = annotatedFrame.isGroundTruth ? 1 : 0;
      let scale = framesManager.displayScale;
      let annotation = {t: frameNumber, x: bbox.x / scale, y: bbox.y / scale, width: bbox.width / scale, height: bbox.height / scale, l: isGroundTruth};
      output.annotations.push(annotation);
    }
  }
  return output;
}

function generateJSON() {
  let targetObject = annotatedObjectsTracker.getAnnotatedObjectByID('target');
  let referenceObject = annotatedObjectsTracker.getAnnotatedObjectByID('reference');
  let output = {};
  output.target = annotatedObjectToJSON(targetObject);
  output.reference = annotatedObjectToJSON(referenceObject);
  // if(referenceObjectCheckbox.checked){
  //   output.reference = annotatedObjectToJSON(referenceObject);
  // }
  // if(output.target === null || output.reference === null){
  //   return;
  // }
  output.transcription = transcriptionInput.value;
  output.perspective = perspectiveInput.value;
  output.spatial_relationship = spatialRelationshipInput.value;
  let outputJSON = JSON.stringify(output);

  let writeStream = streamSaver.createWriteStream('output.json').getWriter();
  let encoder = new TextEncoder();
  writeStream.write(encoder.encode(outputJSON));
  writeStream.close();
}

function importAnnotatedObjectFromJSON(objectJSON){
  let id = objectJSON.id;
  let annotatedObject = annotatedObjectsTracker.getAnnotatedObjectByID(id);
  if(annotatedObject === null){
    throw new Error("Object with unknown ID found: " + id + ". Annotated Object ID must be either 'target' or 'reference'");
  }

  annotatedObject.label = objectJSON.label;
  annotatedObject.color = objectJSON.color;
  annotatedObject.shape = objectJSON.shape;
  annotatedObject.location = objectJSON.location;
  annotatedObject.dom = newBboxElement();
  if(id == 'target'){
    annotatedObject.dom.style.border = '2px solid rgba(0, 255, 0, 1)';
  }
  else{
    annotatedObject.dom.style.border = '2px solid rgba(255, 0, 0, 1)';
  }

  interactify(
    annotatedObject.dom,
    (x, y, width, height) => {
      let scale = framesManager.displayScale;
      let bbox = new BoundingBox(x * scale, y * scale, width * scale, height * scale);
      annotatedObject.add(new AnnotatedFrame(player.currentFrame, bbox, true));
    }
  );

  let lastFrame = -1;
  let frames = objectJSON.annotations;
  for (let i = 0; i < frames.length; i++) {
    let frame = frames[i];
    let frameNumber = parseInt(frame.t);
    let x = parseInt(frame.x);
    let y = parseInt(frame.y);
    let w = parseInt(frame.width);
    let h = parseInt(frame.height);
    let isGroundTruth = parseInt(frame.l) == 1;

    if (lastFrame + 1 != frameNumber) {
      let annotatedFrame = new AnnotatedFrame(lastFrame + 1, null, true);
      annotatedObject.add(annotatedFrame);
    }

    let bbox = new BoundingBox(x, y, w, h);
    let annotatedFrame = new AnnotatedFrame(frameNumber, bbox, isGroundTruth);
    annotatedObject.add(annotatedFrame);

    lastFrame = frameNumber;
  }

  if (lastFrame + 1 < framesManager.frames.totalFrames()) {
    let annotatedFrame = new AnnotatedFrame(lastFrame + 1, null, true);
    annotatedObject.add(annotatedFrame);
  }
  addAnnotatedObjectControls(annotatedObject);

}

function importJSON() {
  if (this.files.length != 1) {
    return;
  }

  var reader = new FileReader();
  reader.onload = (e) => {
    if (e.target.readyState != 2) {
      return;
    }

    if (e.target.error) {
      throw 'file reader error';
    }

    let json = JSON.parse(e.target.result);
    let targetObject = json.target;
    importAnnotatedObjectFromJSON(targetObject);
    transcriptionInput.value = json.transcription;
    perspectiveInput.value = json.perspective;
    spatialRelationshipInput.value = json.spatial_relationship;    

    deleteReferenceObject();
    if('reference' in json){
      createReferenceObject();
      let referenceObject = json.reference;
      importAnnotatedObjectFromJSON(referenceObject);
    }

    player.drawFrame(player.currentFrame);
  };
  reader.readAsText(this.files[0]);
}

function addAnnotatedObjectControls(handler, annotatedObject) {
  let div = undefined;
  if(annotatedObject.controls === undefined){
    div = $('<div></div>');
    annotatedObject.controls = div;
    $('#objects').append(div);
  }
  else{
    div = annotatedObject.controls;
  }

  let id = $('<b><label></b>');
  if(annotatedObject.id == 'target'){
    id.append('Target object');
  }
  else{
    id.append('Reference object');
  }

  let label = $('<div>');
  label.append('<label>Label:  </label>');;
  let label_input = $('<input type="text"/>');
  if (annotatedObject.label) {
    label_input.val(annotatedObject.label);
  }
  label_input.on('change keyup paste mouseup', function() {
    annotatedObject.label = this.value;
  });
  label.append(label_input);
  label.css({
    'padding-top': '5px'
  });


  let color = $('<div>');
  color.append('<label>Color:  </label>');;
  let color_input = $('<input type="text"/>');
  if (annotatedObject.color) {
    color_input.val(annotatedObject.color);
  }
  color_input.on('change keyup paste mouseup', function() {
    annotatedObject.color = this.value;
  });
  color.append(color_input);
  color.css({
    'padding-top': '5px'
  });


  let shape = $('<div>');
  shape.append('<label>Shape:  </label>');;
  let shape_input = $('<input type="text"/>');
  if (annotatedObject.shape) {
    shape_input.val(annotatedObject.shape);
  }
  shape_input.on('change keyup paste mouseup', function() {
    annotatedObject.shape = this.value;
  });
  shape.append(shape_input);
  shape.css({
    'padding-top': '5px'
  });


  let location = $('<div>');
  location.append('<label>Location:  </label>');;
  let location_input = $('<input type="text"/>');
  if (annotatedObject.location) {
    location_input.val(annotatedObject.location);
  }
  location_input.on('change keyup paste mouseup', function() {
    annotatedObject.location = this.value;
  });
  location.append(location_input);
  location.css({
    'padding-top': '5px'
  });

  let annotation_button = $('<button>Draw Annotation</button/>');
  annotation_button.on('click', () => handler.annotateObject(annotatedObject.id));
  annotation_button.css({
    'padding-top': '5px'
  });

  div.css({
    'border': '1px solid black',
    'display': 'inline-block',
    'margin': '5px',
    'padding': '10px'});
  div.empty();
  div.append(id); div.append($('<br />'));
  div.append(label);
  div.append(color);
  div.append(shape);
  div.append(location); div.append($('<br />'));
  div.append(annotation_button);
}
