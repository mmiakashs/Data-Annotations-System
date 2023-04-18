var subjectSessionSelectMapping = {};
var subjectSessionNumFramesMapping = {};

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
    sessionHandler.clear();
    sessionHandler.loadNewSession(subject, session, numFrames);
    for(let i = 0; i < numFrames; i++){
        let url = baseURL + i;
        $.ajax({
            url,
            success: function( result ) {
                sessionHandler.addFrame(i, result);
            }
        });    
    }

}

function initAPIHandler(){
    console.log("Initializing API handler!");
    refreshSelectOptions();
}
