
function csvToArray(csvData) {
    var result = $.csv.toObjects(csvData);
    // console.log(result);
    return(result);
}

function processData(employeeData) {
    const employees = {};
    let root = null;
    
    // Skip header row
    for (const rownum in employeeData) {
        const row = employeeData[rownum];
        if (row.NAME_DISPLAY.indexOf("Empty") >= 0) {
            continue;
        }
        // Assuming CSV columns: displayName, organizationPerson.title, user.manager.title
        var supervisorId = row.REPORTS_TO;
        const id = row.IDENTIFIER_NAME;
      
        employees[id] = {
            id: id,
            name: row.NAME_DISPLAY,
            title: row.JOBTITLE,
            supervisorId: supervisorId,
            mail: row.email,
            workemail: row.WORKEMAIL,
            o365: row.o365,
			children: []
        };
        
        // Find the root (no supervisor_id)
        // if (supervisorId.trim() === "") {
        //     root = employees[id];
        // }

		// hard-code Dan Lepore as root of tree
        if (row.cn == 'dl29339') {
            root = employees[id];
            root.className = "root-node";
        }
    }
    
    // Build the tree structure
    for (const id in employees) {
        const employee = employees[id];
        const childrenCt = employeeData.filter((item) => item["REPORTS_TO"] == employee.id).length;
        // if not the root and has more than 4 direct reports, mark as hybrid, 
        // which will display vertically instead of horizontally
        if (childrenCt > 4 && employee.id != root.id) {
            employee.hybrid = true;
        }
        if (employee.supervisorId !== "" && employees[employee.supervisorId]) {
            employees[employee.supervisorId].children.push(employee);
        }
        if (employee.supervisorId === root.id) {
            employee.className = "top-level-node";
        }
    }
	
	// children now exist, rewalk to set classes
	var childLevel = 1;
	function walkPerson(node){
		if (node.className) {
            node.className += " level-" + childLevel;
        }
        else{
            node.className = "level-" + childLevel;
        }
		if (node.children.length > 0){
			childLevel++;
            node.className += " manager";
			for (var person in node.children){
				walkPerson(node.children[person]);
			}
			childLevel--;
            // if a person has direct reports, sort so that managers appear before non-managers
            node.children.sort((a, b) => {
                    const aIsManager = a.className && a.className.includes('manager');
                    const bIsManager = b.className && b.className.includes('manager');
                
                    // Sort managers (true/1) before non-managers (false/0)
                    return bIsManager - aIsManager;
                });
            var childManagerCt = node.children.filter((item) => item.className && item.className.includes("manager")).length;
            if (childManagerCt == 0) {
                node.className += " vertical";
            }
        }
	}
	walkPerson(root);

    // console.log(JSON.stringify(root));
    return root;
}
    
$(function() {

    $('#chart-container').append(`<i class="fa-solid fa-spinner spinner"></i>`);
    $.ajax({
    'url': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPDcbkLK1xuXV2hLpthcGQO9VDBA6TXGWK-0pMw655NZl91NJxRyJXB1nlr4UXCuGgrRxZ9huHwIMQ/pub?gid=194817631&single=true&output=csv',
    'dataType': 'text'
    })
    .done(function(data, textStatus, jqXHR) {
        // console.log('AJAX request successful');
        const employeeData = csvToArray(data);
        const orgData = processData(employeeData);
        $('#chart-container').orgchart({
        'data': orgData,
        'nodeContent': 'title',
        'verticalLevel': 4,
        'pan': true,
        'createNode': function($node, data) {
			var secondMenu = `<div class="second-menu">
								<ul class="button-list">
									<li><a target="details" href="https://contacts.google.com/${data.mail}">Google</a></li>
									<li><a target="details" href="https://us1.teamdynamix.com/tdapp/form/rotcmo?__cust=vccs&tdxusername=${data.mail}">TDX</a></li>
									<li><a target="details" href="https://m365.cloud.microsoft/search/overview?form=delve&pp=${data.o365}%40fab6beb5-3604-42df-bddc-f4e9ddd654d5%7C${data.workemail}">O365</a></li>
									</ul>
								</div>`;
            $node.append(secondMenu);
			$node.hover(function() {
				$(this).children('.second-menu').toggle();
			});
        }
        });
        // add vertical class to any ul that follows a div and doesn't already have the class, to catch any nodes that should be vertical but weren't marked as such in the data
        $('div.vertical + ul:not(.vertical)').addClass('vertical');
    })
    .always(function() {
        $('#chart-container').children('.spinner').remove();
    });
    
});
