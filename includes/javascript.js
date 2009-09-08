//--------------------------------------------------
// This section is code for the user list in the add_item popup


// toggles colors for list_users
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

})(jQuery);

function setFieldsToZero(){
	$("#expanded_buyers input").val(0);
	$("#expanded_users input").val(0);
}

// this sucks. fix this
d = {}
//-----------------------------------------
// this refreshes the item list. making it into a function so I can call it again when edits are made and we have to refresh on the fly
function loadItemList(list_users){

	// applies JS code to the item list that's dumped into the DOM
	function onListUpdate(){
		// js behavior for sliding items up and down
		// also code to fill in information when you're editing a record 
		
	
		// give fancy js behavior
		$(".item").toggle(
			function(){
				$(this).find('.item_description').slideDown('normal');
			}, function() {
				$(this).find('.item_description').slideUp('normal');
			}
		);
		$(".item:odd").css({'background-color': '#ffc97c'});
		$(".item:even").css({'background-color': '#ffe1b5'});
		$(".item_description").hide();
	
	
		// delete button behavior
		$(".delete").click(function(){
			delete_id = parseInt($(this).parent().attr('id'));
			$.ajax({
				url: '/dtms/delete_item',
				data: {'delete_id': delete_id},
				type: 'POST',
				dataType: 'json',
				success: function(data){ pageRefresh(list_users); },
				error: function(data){ document.write(data.responseText); }
			});
		});
	
		// edit button behavior
		$(".edit").click(function(){
			setFieldsToZero();
			list_users.clear_names();
	
			// change the action button to say "edit"
			$("#action").text('edit');
	
			// this id corresponds to the unique id in the django db
			edit_id = parseInt($(this).parent().attr('id'));
	
			// this still needs to be fixed. a bad global variable
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
					list_users.set_names(t);
	
					$('#dialog').jqmShow();
	
					// editing add_item form data
					$('#name').val(data['name']);
					$('#price').val(data['price']);
					$('#purch_date').val(data['purch_date']);
					$('#comments').val(data['comments']);
					$('#tags').val(data['tags']);
					$('#sub_tag').val(data['sub_tag']);

					if (data['ind_pay'] !== undefined){
						for (x in data['ind_pay'])
							$("#" + x + "expanded_user").val(data['ind_pay'][x]);
						
						for (x in data['buyer_pay'])
							$("#" + x + "expanded_buyer").val(data['buyer_pay'][x]);

						$("#expanded_section").css("display", "inline");
					} else {
						$("#expanded_section").css("display", "none");
					}
				},
				error: function(data){ document.write(data.responseText); }
			});
		});
	}

	$.ajax({
		url: '/dtms/list',
		success: function(data){
			$("#list").html(data)
			onListUpdate();
		},
		error: function(data){
			document.write(data.responseText);
		}

	});
}


// scrapes form and submits to /add_item
function submitForm(list_users){
	// gets all the information from the forms
	var str= $("#purch_date").val();
	var d = str.split("/");
	var tag;
	if ($("#tags").val() == '')
		tag = "Uncategorized";

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
		var ind_p = p / $(".selected_yes").length;
		$("#" + uid + "expanded_buyer").val(p);
		var a = list_users.return_names();
		console.log(a);
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
			$('#dialog').jqmHide();
		},
		error: function(xhr){ document.write(xhr.responseText); }
	});

	// call the list again to reflect changes
	pageRefresh(list_users);
}

function getArrayFromInputFields(id){
	var values = [];
	var $d = $("#" + id + " input");
	$d.each(function(){
		values.push([parseInt($(this).attr('id')),$(this).val()]);
	});
	return values;
}

function drawGraphs(){
	$.ajax({
		url: '/dtms/tag_breakdown/' + $('#user_id').val() + '/',
		dataType: 'json',
		success: function(data){
		var test = [
			{ label: "Series1",  data: [[1,10]]},
			{ label: "Series2",  data: [[1,30]]},
			{ label: "Series3",  data: [[1,90]]},
			{ label: "Series4",  data: [[1,70]]},
			{ label: "Series5",  data: [[1,80]]},
			{ label: "Series6",  data: [[1,0]]}
		];
			$.plot($("#graph"), data,
			{
			    series: {
			        pie: {
			            show: true
			        }
			    }
			});
		},
		error: function(data){ document.write(data.responseText); }
	});
}

function pageRefresh(list_users){
	loadItemList(list_users);
	drawGraphs();
}


// JS code for the add_item box (getting info from fields, sending it to django, and fade effect)
$(document).ready(function(){

	// load item list
	var $list_users = $('#list_users').toggle_selected();
	pageRefresh($list_users);

	setFieldsToZero();


	$("#advanced").click(function(){
		if ($("#expanded_section").css("display") == "none")
			$("#expanded_section").css("display", "inline");
		else
			$("#expanded_section").css("display", "none");
		$("#basic_users").css("display", "none");
	});

	// make sure the submit button says the right thing. this gets changed when the user edits something
	$("#add_item").click(function(){
		$("#action").text('submit');
		$("#expanded_section").css("display", "none");
		$list_users.clear_names();
		
		setFieldsToZero();
	});

	// item submit button
	$("#action").click(function(){
		submitForm($list_users);
		$list_users.clear_names();
	});


	// fade in and out code for add_item form
	var myOpen=function(hash){ hash.w.fadeIn('1600')}; 
	$('#dialog').jqm({onShow: myOpen}).jqmAddTrigger('.openjqm');

	// fill in today's date for purchase field
	var currentTime = new Date()
	var month = currentTime.getMonth() + 1;
	var day = currentTime.getDate();
	var year = currentTime.getFullYear();
	var str = year + "/" + month + "/" + day;

	$('#purch_date').val(str);
});


