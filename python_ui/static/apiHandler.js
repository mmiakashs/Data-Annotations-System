var subjectSessionSelectMapping = {};

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
                for(let session in result[subject]){
                    subjectSessionSelectMapping[subject].push({
                        'text': 'Session ' + session,
                        'value': session,
                    });
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
    let loading = confirm("Are you sure you want to load new session data?");
    if(!loading){
        return;
    }
}


function initAPIHandler(){
    console.log("Initializing API handler!");
    refreshSelectOptions();
}
