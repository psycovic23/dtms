//--------------------------------------------------
// This section is code for the user list in the add_item popup


// toggle_selected plugin - toggles colors for list_users
(function($) {		
	var selected_users = {};

	// for state of all_button
	var status = 0;

	$.fn.toggle_selected = function () {
		$list = this;
		$list_elements = $('li', this);

		$all_button = $('<li class="option_text">All</a>');
		$(this).prepend($all_button);

		// all button behaviors
		if (!$all_button.hasClass("unselected")){
			$all_button.addClass("unselected");
			$all_button.mouseover( function() {
				$all_button.addClass("hover");
			});	
			$all_button.mouseout( function() {
				$all_button.removeClass("hover");
			});
		}

		$all_button.click(function(){
			$list_elements.removeClass().addClass('option_text');
			if (status == 0){
				$all_button.addClass('selected_yes');
				$list_elements.addClass('selected_yes');
				status = 1;
				$list_elements.each(function(){
					selected_users[$(this).attr('id')] = 1;
				});
			}
			else {
				$all_button.removeClass('selected_yes');
				$list_elements.addClass('unselected');
				status = 0;
				$list_elements.each(function(){
					selected_users[$(this).attr('id')] = 0;
				});
			}
		});
		
		// each element of list behavior
		return $list_elements.each( function() {
			
			selected_users[parseInt($(this).attr('id'))] = 0;

			// initialize each to unselected and add mouseover/out event
			if (!$(this).hasClass("unselected")){
				$(this).addClass("unselected");
				$(this).mouseover( function() {
					$(this).addClass("hover");
				});	
				$(this).mouseout( function() {
					$(this).removeClass("hover");
				});
			}
	
			$(this).mousedown( function(){
				var id = parseInt($(this).attr('id'));
	
				// flip between unselected and selected
				if ($(this).hasClass("hover") || $(this).hasClass('unselected')){
					$(this).removeClass("hover").removeClass('unselected').addClass("selected_yes").unbind('mouseover').unbind('mouseout'); 
					selected_users[id] = 1;
	
				} else if ($(this).hasClass("selected_yes")){
					selected_users[id] = 0;
					$(this).removeClass("selected_yes").addClass("unselected");
					$(this).mouseover( function() {
						$(this).addClass("hover");
					});	
					$(this).mouseout( function() {
						$(this).removeClass("hover");
					}); 
				}
			});
		});
	}

	$.fn.clear_names = function(){
		$(this).removeClass("selected_yes").addClass("unselected");
	}

	$.fn.return_names = function(){
		return selected_users;
	}

	$.fn.set_names = function(a){
		selected_users = a;
	}

	$.fn.number_of_selected = function(){
		function nnz(x){
			var num = 0;
			for (t in x){
				if (x[t] != 0)
					num++;
			}
			return num;
		}

		return nnz(selected_users);
	}

})(jQuery);

function setFieldsToZero(){
	$("#expanded_buyers input").val(0);
	$("#expanded_users input").val(0);
}

// this sucks. fix this
d = {}

//-----------------------------------------
// this refreshes the item list. making it into a function so I can call it again when edits are made and we have to refresh on the fly
function loadItemList(args){
	var default_args = {
		'archive_id':	0,
		'tagFilter':	'None'
	}

	options = {};
	$.extend(options, default_args, args);

	// applies JS code to the item list that's dumped into the DOM
	function onListUpdate(data){
		
		// load the data into rightPanel	
		$("#rightPanel").html(data['html']).fadeIn("fast");

		// give fancy js behavior
		$(".item").toggle(
			function(){
				$(this).find('.item_description').slideDown('normal');
			}, function() {
				$(this).find('.item_description').slideUp('normal');
			}
		);

		// item hover actions
		$(".item:odd").css({'background-color': '#ffc97c'});
		$(".item:even").css({'background-color': '#ffe1b5'});
		$(".item_description").hide();
		$(".item:odd").hover(
			function(){ $(this).css({'background-color': '#39c'}); }, 
			function(){ $(this).css({'background-color': '#ffc97c'});}
		);
		$(".item:even").hover(
			function(){ $(this).css({'background-color': '#39c'}); }, 
			function(){ $(this).css({'background-color': '#ffe1b5'});}
		);
	
	
		// delete button behavior
		$(".delete").click(function(){
			delete_id = parseInt($(this).parent().attr('id'));
			$.ajax({
				url: '/dtms/delete_item',
				data: {'delete_id': delete_id},
				type: 'POST',
				dataType: 'json',
				success: function(data){ loadItemList(); },
				error: function(data){ document.write(data.responseText); }
			});
		});
	
		// edit button behavior
		$(".edit").click(function(){

			// this id corresponds to the unique id in the django db
			edit_id = parseInt($(this).parent().attr('id'));
			loadAddItem(edit_id);
		});

		// load graph data and hide the div
		var graphdata = JSON.parse(data['graphData']);
		$.plot($("#graph"), graphdata,  {xaxis: {autoscaleMargin: .5, ticks: 0}, yaxis: {autoscaleMargin: .5}, grid: {hoverable: true, clickable: true}, bars: {show: true} }); 

		// potential bug - if tags have overlapping text, it filters incorrectly
		$("#graph").bind("plotclick", function(event, pos, item){
			if ($("div.tag:contains('" + item.series.label + "')").length != 0){
				$("div.tag:contains('" + item.series.label + "')").parent().parent().slideDown();
				$("div.tag:not(:contains('" + item.series.label + "'))").parent().parent().slideUp();
			}
		});

		$("#graph").hide();

		// taglist behavior
		$(".tagNames").click(function(){
			if ($(this).html() == "all"){
				$("div.item").slideDown();
			} else {
				if ($("div.tag:contains('" + $(this).html() + "')").length != 0){
					$("div.tag:contains('" + $(this).html() + "')").parent().parent().slideDown();
					$("div.tag:not(:contains('" + $(this).html() + "'))").parent().parent().slideUp();
				}
			}
		}).hover(function(){ $(this).css({ 'background-color': '#39c'});}, function(){ $(this).css({ 'background-color': '#fff'})});



		// load analysis button
		$("#showAnalysis").toggle(function(){
			$("#graph").slideDown('slow');
			$("#tagList").slideUp();
			$(this).val('hide analysis')
		}, function(){
			$("#tagList").slideDown();
			$("#graph").slideUp('slow');
			$(this).val('show analysis');
		});

	}


	// call to run Config function

	$("#rightPanel").fadeOut("fast", function(){

		// determine what archive list to load, based on arguments from options
		// also there is tagFiltering, which isn't done yet
		
		var url_str = '/dtms/list';
		url_str += '/' + options['archive_id'] + '/';

		if (options['tagFilter'] != 'None')
			url_str += tagFilter + '/';

		$.ajax({
			url: url_str,
			dataType: 'json',
			success: function(data){
				// maybe throw these back into the config function
				onListUpdate(data);
			},
			error: function(data){
				document.write(data.responseText);
			}
		});
	});
}


// scrapes form and submits to /add_item
function submitForm(list_users){
	function getArrayFromInputFields(id){
		var values = [];
		var $d = $("#" + id + " input");
		$d.each(function(){
			values.push([parseInt($(this).attr('id')),$(this).val()]);
		});
		return values;
	}
	// gets all the information from the forms
	var str= $("#purch_date").val();
	var d = str.split("/");
	var tag;

	if ($("#tags").val() == '')
		tag = "Uncategorized";
	else
		tag = $("#tags").val();

	var data = {
		'name': $("#name").val(),
		'purch_date': d,
		'price': $("#price").val(),
		'buyer': 1,
		'comments': $("#comments").val(),
		'tags': tag,
		'sub_tag': $("#sub_tag").val(),
		'house_id': 1,
		'archive_id': 0,
	};

	// this only works for users_yes, not the maybe part	
	if ($("#expanded_section").css('display') == "none"){
		var uid = $("#user_id").val();
		var p = $("#price").val();
		var ind_p = p / list_users.number_of_selected();
		$("#" + uid + "expanded_buyer").val(p);
		var a = list_users.return_names();
		for (t in a){
			if (a[t])
				$("#" + t + "expanded_user").val(ind_p);
		}
	}


	if ($("#action").html() == 'edit')
		data = $.extend(data, {'edit_id': edit_id});

	data = $.extend(data, {'expanded_buyers': getArrayFromInputFields("expanded_buyers")});
	data = $.extend(data, {'expanded_users': getArrayFromInputFields("expanded_users")});

	var c = JSON.stringify(data);

	$.ajax({
		url: '/dtms/add_item', 
		type: "POST",
		data: {'string': c},
		success: function(data){
			loadItemList();
		},
		error: function(xhr){ document.write(xhr.responseText); }
	});

}


function loadAddItem(edit_id){
	function addItemConfigure(data){
		// load item list
		var $list_users = $('#list_users').toggle_selected();
		setFieldsToZero();

		$("#tags").autocomplete(data['tags']);
	
		// make the advanced selection button
		$("#advanced").click(function(){
			if ($("#expanded_section").css("display") == "none"){
				$("#expanded_section").css("display", "inline");
				$("#basic_users").css("display", "none");
			} else {
				$("#expanded_section").css("display", "none");
				$("#basic_users").css("display", "inline");
			}
		});
	
	
		// item submit button
		$("#action").click(function(){
			submitForm($list_users);
		});
		
		// fill in today's date for purchase field
		var currentTime = new Date()
		var month = currentTime.getMonth() + 1;
		var day = currentTime.getDate();
		var year = currentTime.getFullYear();
		var str = year + "/" + month + "/" + day;
	
		$('#purch_date').val(str);
		return $list_users;
	}

	var $list_users;

	$("#rightPanel").fadeOut("fast", function(){
		$.ajax({
			url: '/dtms/addItem',
			dataType: 'json',
			success: function(data){
				$("#rightPanel").html(data['html']).fadeIn("fast");

				// initialization steps
				$("#action").text('submit');
				$("#expanded_section").css("display", "none");
				setFieldsToZero();

				$list_users = addItemConfigure(data);
				$list_users.clear_names();
	
				if (edit_id !== undefined){
					setFieldsToZero();
					$list_users.clear_names();
	
					// change the action button to say "edit"
					$("#action").text('edit');
	
					d = {'item_id': edit_id};
					$.ajax({
						url: '/dtms/edit_item',
						type: 'POST',
						data: d,
						dataType: 'json',
						success: function(data){
		
							// set the user buttons to reflect who's using the item
							t = {};
							for (x in data['users']){
								if (data['users'][x] != 0){
									$('#' + x + 'option').addClass('selected_yes').removeClass('unselected');
									t[x] = 1;	
								} else {
									t[x] = 0;
								}
							}
							$list_users.set_names(t);
		
		
							// editing add_item form data
							$('#name').val(data['name']);
							$('#price').val(data['price']);
							$('#purch_date').val(data['purch_date']);
							$('#comments').val(data['comments']);
							$('#tags').val(data['tags']);
							$('#sub_tag').val(data['sub_tag']);
							for (x in data['ind_pay'])
								$("#" + x + "expanded_user").val(data['ind_pay'][x]);
							
							for (x in data['buyer_pay'])
								$("#" + x + "expanded_buyer").val(data['buyer_pay'][x]);
	
	
							if (data['equalArray'] != 1){
								$("#expanded_section").css("display", "inline");
							} else {
								$("#expanded_section").css("display", "none");
							}
						},
						error: function(data){ document.write(data.responseText); }
					});
				}
			},
			error: function(xhr){
				document.write(xhr.responseText);
			}
		});
	});
}

function loadClearCycle(){
	$.ajax({
		url: '/dtms/clear_cycle',
		success: function(){
			loadItemList();
		},
		error: function(data){ document.write(xhr.responseText); }
	});
}

function loadArchives(){
	$("#rightPanel").fadeOut("fast", function(){
		$.ajax({
			url: '/dtms/showArchives',
			success: function(data){
				$("#rightPanel").html(data).fadeIn("fast");
	
				// give fancy js behavior DUPLICATE CODE
				$(".item:odd").css({'background-color': '#ffc97c'});
				$(".item:even").css({'background-color': '#ffe1b5'});
	
				$(".item").click(function(){
					var archive_id = parseInt($(this).attr('id'));
					loadItemList({'archive_id': archive_id});
				});
			},
			error: function(data){ document.write(data.responseText); }
		});
	});
}

$(document).ready(function(){

//---------------- JS code for index page -------------------

	// load item list on page load
	loadItemList();

	// button calls

	$("#new_cycle").click(function(){
		loadClearCycle();
	});

	$("#add_item").click(function(){
		loadAddItem();
	});

	$("#loadItemList").click(function(){
		loadItemList();
	});

	$("#showArchives").click(function(){
		loadArchives();
	});

});
