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
      let annotation = {t: frameNumber, x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height, l: isGroundTruth};
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
  if(output.target === null || output.reference === null){
    return;
  }
  output.transcription = transcriptionInput.value;
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
      let bbox = new BoundingBox(x, y, width, height);
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
    let referenceObject = json.reference;
    importAnnotatedObjectFromJSON(targetObject);
    importAnnotatedObjectFromJSON(referenceObject);
    transcriptionInput.value = json.transcription;
    spatialRelationshipInput.value = json.spatial_relationship;
  
    player.drawFrame(player.currentFrame);
  };
  reader.readAsText(this.files[0]);
}

function newBboxElement() {
  let dom = document.createElement('div');
  dom.className = 'bbox';
  doodle.appendChild(dom);
  return dom;
}

function addAnnotatedObjectControls(annotatedObject) {
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
  div.append(location);

}

function resetAllAnnotatedObjects() {
  for (let i = 0; i < annotatedObjectsTracker.annotatedObjects.length; i++) {
    let annotatedObject = annotatedObjectsTracker.annotatedObjects[i];
    annotatedObject.controls.remove();
    $(annotatedObject.dom).remove();
  }
  annotatedObjectsTracker.annotatedObjects = [];

  let targetAnnotatedObject = new AnnotatedObject();
  targetAnnotatedObject.id = 'target';
  targetAnnotatedObject.dom = newBboxElement();
  annotatedObjectsTracker.annotatedObjects.push(targetAnnotatedObject);
  addAnnotatedObjectControls(targetAnnotatedObject);

  if(referenceObjectCheckbox.checked){
    createReferenceObject();
    spatialRelationshipDiv.hidden = false;
  }
  else{
    deleteReferenceObject();
    spatialRelationshipDiv.hidden = true;
  }

  spatialRelationshipInput.text = "";
  transcriptionInput.text = "";
}

function createReferenceObject() {
  console.log("CREATING REFERENCE OBJECT");
  let referenceAnnotatedObject = new AnnotatedObject();
  referenceAnnotatedObject.id = 'reference';
  referenceAnnotatedObject.dom = newBboxElement();
  annotatedObjectsTracker.annotatedObjects.push(referenceAnnotatedObject);
  addAnnotatedObjectControls(referenceAnnotatedObject);
}

function deleteReferenceObject(){
  deleteAnnotatedObject('reference');
}

function deleteAnnotatedObject(id) {
  for (let i = annotatedObjectsTracker.annotatedObjects.length - 1; i >= 0; i--) {
    let annotatedObject = annotatedObjectsTracker.annotatedObjects[i];
    if(annotatedObject.id == id){
      annotatedObjectsTracker.annotatedObjects.splice(i, 1);
      annotatedObject.controls.remove();
      $(annotatedObject.dom).remove();  
    }
  }
}
