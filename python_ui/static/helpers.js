function setSelectOptions(selectQuery, optionList){
    console.log(optionList);
    selectQuery.find('option').remove().end();
    $.each(optionList, function (i, item) {
        selectQuery.append($('<option>', { 
            value: item.value,
            text : item.text 
        }));
    });
}