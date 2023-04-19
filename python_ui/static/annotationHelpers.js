
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
    this.label = undefined;
    this.color = undefined;
    this.shape = undefined;
    this.location = undefined;
    this.controls = undefined;
    this.doms = {};
    this.bboxs = {};
  }

  loadDataFromAnnotatedObject(obj){
    this.label = obj.label;
    this.color = obj.color;
    this.shape = obj.shape;
    this.location = obj.location;
    this.bboxs = obj.bboxs;
    this.doms = {};

    for(let view in this.bboxs){
      let dom = undefined;
      let bbox = this.bboxs[view];
      if(view == 'ego'){
        dom = newBboxElement(doodleEgo);
      }
      else if(view == 'exo'){
        dom = newBboxElement(doodleExo);
      }

      if(this.id == 'target'){
        dom.style.border = '2px solid rgba(0, 255, 0, 1)';
      }
      else{
        dom.style.border = '2px solid rgba(255, 0, 0, 1)';
      }

      this.doms[view] = dom;

      dom.style.width = bbox.width + 'px';
      dom.style.height = bbox.height + 'px';
      dom.style.left = bbox.x + 'px';
      dom.style.top = bbox.y + 'px';

      interactify(
        dom,
        (x, y, width, height) => {
          let bbox = new BoundingBox(x, y, width, height);
          this.bboxs[view] = bbox;
        }
      );  
    }

    addAnnotatedObjectControls(annotationHandler, this);
  }
}

class AnnotationHandler {
  constructor() {
    this.annotatedObjects = [];
    this.annotationHistory = {};
    this.currentlyAnnotating = null;
  }

  getAnnotationHistoryKey(subject, session, frameNum){
    return subject + ";" + session + ";" + frameNum;
  }

  saveObjectsToAnnotationHistory() {
    let key = this.getAnnotationHistoryKey(dataHandler.subject, dataHandler.session, dataHandler.currentFrame);
    this.annotationHistory[key] = {};
    this.annotationHistory[key].transcription = transcriptionInput.value;
    this.annotationHistory[key].perspective = perspectiveInput.value;
    this.annotationHistory[key].spatial_relationship = spatialRelationshipInput.value;
    this.annotationHistory[key].objects = []

    for (let i = 0; i < this.annotatedObjects.length; i++) {
      let annotatedObject = this.annotatedObjects[i];
      this.annotationHistory[key].objects.push(annotatedObject);
    }
  }

  loadSavedAnnotations() {
    let key = this.getAnnotationHistoryKey(dataHandler.subject, dataHandler.session, dataHandler.currentFrame);
    if(key in this.annotationHistory){
      this.deleteAnnotatedObject('target');
      this.deleteAnnotatedObject('reference');
      referenceObjectCheckbox.checked = false;
      for(let savedObj of this.annotationHistory[key].objects){
        if(savedObj.id == 'reference'){
          referenceObjectCheckbox.checked = true;
        }
      }

      for(let savedObj of this.annotationHistory[key].objects){
        let newObj = this.createAnnotatedObject(savedObj.id);
        newObj.loadDataFromAnnotatedObject(savedObj);
      }

      transcriptionInput.value = this.annotationHistory[key].transcription;
      perspectiveInput.value = this.annotationHistory[key].perspective;
      spatialRelationshipInput.value = this.annotationHistory[key].spatial_relationship;
    }
  }

  resetAllAnnotatedObjects() {
    for (let i = this.annotatedObjects.length - 1; i >= 0; i--) {
      this.deleteAnnotatedObject(this.annotatedObjects[i].id);
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
    return annotatedObject;
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

function annotatedObjectToJSON(annotatedObject, frameNum){
  let description = {};
  description.label = annotatedObject.label;
  description.color = annotatedObject.color;
  description.shape = annotatedObject.shape;
  description.location = annotatedObject.location;
  description.bboxs = annotatedObject.bboxs;

  if(description.label === undefined){
    description.label = null;
  }
  if(description.color === undefined){
    description.color = null;
  }
  if(description.shape === undefined){
    description.shape = null;
  }
  if(description.location === undefined){
    description.location = null;
  }
  if(description.bboxs === undefined){
    description.bboxs = {};
  }
  else{
    // Resize bbox values based on the previously calculated displayScale.
    for(let view in description.bboxs){
      let displayScale = 1;
      if(view == 'ego'){
        displayScale = getDisplayScale(dataHandler.getFrame(frameNum).ego_height);
      }
      else if(view == 'exo'){
        displayScale = getDisplayScale(dataHandler.getFrame(frameNum).exo_height);
      }
      for(let bbox_key in description.bboxs[view]){
        description.bboxs[view][bbox_key] = description.bboxs[view][bbox_key] / displayScale;
      }

    }
  }
  return description;
}

function generateJSON() {
  let output = {};
  annotationHandler.saveObjectsToAnnotationHistory();
  for(let i = 0; i < dataHandler.numFrames; i++){
    let key = annotationHandler.getAnnotationHistoryKey(dataHandler.subject, dataHandler.session, i);
    if(!(key in annotationHandler.annotationHistory)){
      alert("You must visit every frame before attempting to save data, but you haven't visited frame " + (i + 1) + " yet!");
      return;
    }
    output[i] = {objects: {}};
    for(let annotatedObject of annotationHandler.annotationHistory[key].objects){
      output[i].objects[annotatedObject.id] = annotatedObjectToJSON(annotatedObject, i);
    }

    output[i].transcription = annotationHandler.annotationHistory[key].transcription;
    output[i].perspective = annotationHandler.annotationHistory[key].perspective;
    output[i].spatial_relationship = annotationHandler.annotationHistory[key].spatial_relationship;
  }
  console.log(output);
  saveJSONData(output);
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
