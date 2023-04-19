var subjectSessionSelectMapping = {};
var subjectSessionNumFramesMapping = {};

function setSelectOptions(selectQuery, optionList){
    selectQuery.find('option').remove().end();
    $.each(optionList, function (i, item) {
        selectQuery.append($('<option>', { 
            value: item.value,
            text : item.text 
        }));
    });
}

function refreshSelectOptions(){
    $.ajax({
        url: "/get_mapping",
        success: function( result ) {
            let subjects = [{
                text: 'Select Subject',
                value: null,
            }];
            subjectSessionSelectMapping = {null: []};
            for(let subject in result){
                subjectSessionSelectMapping[subject] = [];
                subjectSessionNumFramesMapping[subject] = {};
                subjectSessionSelectMapping[subject].push({
                    text: 'Select Session',
                    value: null,
                });
                for(let session in result[subject]){
                    subjectSessionSelectMapping[subject].push({
                        'text': 'Session ' + session,
                        'value': session,
                    });
                    let numFrames = result[subject][session].length;
                    subjectSessionNumFramesMapping[subject][session] = numFrames;
                }
                subjects.push({
                    'text': 'Subject ' + subject,
                    'value': subject,
                });
            }
            setSelectOptions($("#subjectSelect"), subjects);
        }
    });    
}

function loadSessionAPIData(){
    let subject = $('#subjectSelect').val();
    let session = $('#sessionSelect').val();
    if(subject == null || session == null){
        console.warn("Select sesion before attempting to load session API data!");
        return;
    }

    let loading = confirm("Are you sure you want to load new session data?");
    if(!loading){
        return;
    }

    let numFrames = subjectSessionNumFramesMapping[subject][session];
    let baseURL = "/get_frame/" + subject + "/" + session + "/";
    dataHandler.clear();
    dataHandler.loadNewSession(subject, session, numFrames);
    for(let i = 0; i < numFrames; i++){
        let url = baseURL + i;
        $.ajax({
            url,
            success: function( result ) {
                dataHandler.addFrame(i, result);
            }
        });    
    }
}

function saveJSONData(data) {
    let subject = dataHandler.subject;
    let session = dataHandler.session;
    let url = "/save_session/" + subject + "/" + session;
    data = JSON.stringify(data);
    $.ajax({
        type: "POST",
        url,
        data,
        headers: {
            'Content-Type': 'application/json'
        },
        success: function( result ) {
            let date = new Date().toString();
            generateJSONSuccessText.textContent = "Successfully saved annotation JSON for Subject " + subject + ", Session " + session + " at " + date;
            generateJSONSuccessText.style.color = "green";
            generateJSONSuccessText.hidden = false;
            console.log("Save complete!");
        }
    }).error(function( result ){
        let date = new Date().toString();
        generateJSONSuccessText.textContent = "Failed to save annotation JSON for Subject " + subject + ", Session " + session + " at " + date;
        generateJSONSuccessText.style.color = "red";
        generateJSONSuccessText.hidden = false;
    console.log("Something went wrong :(");
    });
}

function initAPIHandler(){
    console.log("Initializing API handler!");
    refreshSelectOptions();
}
