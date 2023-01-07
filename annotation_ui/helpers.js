// TODO: Test JSONs

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
      window.alert('Play the video in full before downloading the XML so that bounding box data is available for all frames.');
      return;
    }

    let bbox = annotatedFrame.bbox;
    if (bbox != null) {
      let annotation = {t: frameNumber, x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height, l: isGroundTruth};
      output.annotations.push(annotation);
    }
  }
}

function generateJSON() {
  // TODO: Add in transcription and spacial relationship
  let targetObject = annotatedObjectsTracer.getAnnotatedObjectByID('target');
  let referenceObject = annotatedObjectsTracer.getAnnotatedObjectByID('reference');
  let output = {target: annotatedObjectToJSON(targetObject), reference: annotatedObjectToJSON(referenceObject)};
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

  interactify(
    annotatedObject.dom,
    (x, y, width, height) => {
      let bbox = new BoundingBox(x, y, width, height);
      annotatedObject.add(new AnnotatedFrame(player.currentFrame, bbox, true));
    }
  );

  let lastFrame = -1;
  let frames = object.annotations;
  for (let i = 0; i < frames.length; i++) {
    let frames = frames[i]
    let frameNumber = parseInt(frames.t);
    let x = parseInt(frames.x);
    let y = parseInt(frames.y);
    let w = parseInt(frames.width);
    let h = parseInt(frames.height);
    let isGroundThrough = parseInt(frames.l) == 1;

    if (lastFrame + 1 != frameNumber) {
      let annotatedFrame = new AnnotatedFrame(lastFrame + 1, null, true);
      annotatedObject.add(annotatedFrame);
    }

    let bbox = new BoundingBox(x, y, w, h);
    let annotatedFrame = new AnnotatedFrame(frameNumber, bbox, isGroundThrough);
    annotatedObject.add(annotatedFrame);

    lastFrame = frameNumber;
  }

  if (lastFrame + 1 < framesManager.frames.totalFrames()) {
    let annotatedFrame = new AnnotatedFrame(lastFrame + 1, null, true);
    annotatedObject.add(annotatedFrame);
  }
}

function importJSON() {
  // TODO: Add in transcription and spacial relationship
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
    importAnnotatedObjectFromJSON(target);
    importAnnotatedObjectFromJSON(reference);

    player.drawFrame(player.currentFrame);
  };
  reader.readAsText(this.files[0]);
}

function generateXml() {
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<annotation>\n';
    xml += '  <folder>not available</folder>\n';
    xml += '  <filename>not available</filename>\n';
    xml += '  <source>\n';
    xml += '    <type>video</type>\n';
    xml += '    <sourceImage>vatic frames</sourceImage>\n';
    xml += '    <sourceAnnotation>vatic</sourceAnnotation>\n';
    xml += '  </source>\n';

    let totalFrames = framesManager.frames.totalFrames();
    for (let i = 0; i < annotatedObjectsTracker.annotatedObjects.length; i++) {
      let annotatedObject = annotatedObjectsTracker.annotatedObjects[i];

      xml += '  <object>\n';
      xml += '    <moving>true</moving>\n';
      xml += '    <action/>\n';
      xml += '    <verified>0</verified>\n';
      xml += '    <id>' + annotatedObject.id + '</id>\n';
      xml += '    <label>' + annotatedObject.label + '</label>\n';
      xml += '    <color>' + annotatedObject.color + '</color>\n';
      xml += '    <shape>' + annotatedObject.shape + '</shape>\n';
      xml += '    <location>' + annotatedObject.location + '</location>\n';
      xml += '    <createdFrame>0</createdFrame>\n';
      xml += '    <startFrame>0</startFrame>\n';
      xml += '    <endFrame>' + (totalFrames - 1 ) + '</endFrame>\n';

      for (let frameNumber = 0; frameNumber < totalFrames; frameNumber++) {
        let annotatedFrame = annotatedObject.get(frameNumber);
        if (annotatedFrame == null) {
          window.alert('Play the video in full before downloading the XML so that bounding box data is available for all frames.');
          return;
        }

        let bbox = annotatedFrame.bbox;
        if (bbox != null) {
          let isGroundThrugh = annotatedFrame.isGroundTruth ? 1 : 0;

          xml += '    ';
          xml += '<polygon>';
          xml += '<t>' + frameNumber + '</t>';
          xml += '<pt><x>' + bbox.x + '</x><y>' + bbox.y + '</y><l>' + isGroundThrugh + '</l></pt>';
          xml += '<pt><x>' + bbox.x + '</x><y>' + (bbox.y + bbox.height) + '</y><l>' + isGroundThrugh + '</l></pt>';
          xml += '<pt><x>' + (bbox.x + bbox.width) + '</x><y>' + (bbox.y + bbox.height) + '</y><l>' + isGroundThrugh + '</l></pt>';
          xml += '<pt><x>' + (bbox.x + bbox.width) + '</x><y>' + bbox.y + '</y><l>' + isGroundThrugh + '</l></pt>';
          xml += '</polygon>\n';
        }
      }

      xml += '  </object>\n';
    }

    xml += '</annotation>\n';

    let writeStream = streamSaver.createWriteStream('output.xml').getWriter();
    let encoder = new TextEncoder();
    writeStream.write(encoder.encode(xml));
    writeStream.close();
}

function importXml() {
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

      let xml = $($.parseXML(e.target.result));
      let objects = xml.find('object');
      for (let i = 0; i < objects.length; i++) {
        let object = $(objects[i]);
        let id = object.find('id').text();
        let label = object.find('label').text();
        let color = object.find('color').text();
        let shape = object.find('shape').text();
        let location = object.find('location').text();

        // If an annotatedObject with the same id already exists, then delete that before adding this new one.

        let annotatedObject = new AnnotatedObject();
        annotatedObject.id = id;
        annotatedObject.label = label;
        annotatedObject.color = color;
        annotatedObject.shape = shape;
        annotatedObject.location = location;
        annotatedObject.dom = newBboxElement();
        annotatedObjectsTracker.annotatedObjects.push(annotatedObject);

        interactify(
          annotatedObject.dom,
          (x, y, width, height) => {
            let bbox = new BoundingBox(x, y, width, height);
            annotatedObject.add(new AnnotatedFrame(player.currentFrame, bbox, true));
          }
        );

        addAnnotatedObjectControls(annotatedObject);

        let lastFrame = -1;
        let polygons = object.find('polygon');
        for (let j = 0; j < polygons.length; j++) {
          let polygon = $(polygons[j]);
          let frameNumber = parseInt(polygon.find('t').text());
          let pts = polygon.find('pt');
          let topLeft = $(pts[0]);
          let bottomRight = $(pts[2]);
          let isGroundThrough = parseInt(topLeft.find('l').text()) == 1;
          let x = parseInt(topLeft.find('x').text());
          let y = parseInt(topLeft.find('y').text());
          let w = parseInt(bottomRight.find('x').text()) - x;
          let h = parseInt(bottomRight.find('y').text()) - y;

          if (lastFrame + 1 != frameNumber) {
            let annotatedFrame = new AnnotatedFrame(lastFrame + 1, null, true);
            annotatedObject.add(annotatedFrame);
          }

          let bbox = new BoundingBox(x, y, w, h);
          let annotatedFrame = new AnnotatedFrame(frameNumber, bbox, isGroundThrough);
          annotatedObject.add(annotatedFrame);

          lastFrame = frameNumber;
        }

        if (lastFrame + 1 < framesManager.frames.totalFrames()) {
          let annotatedFrame = new AnnotatedFrame(lastFrame + 1, null, true);
          annotatedObject.add(annotatedFrame);
        }
      }

      player.drawFrame(player.currentFrame);
    };
    reader.readAsText(this.files[0]);
}

