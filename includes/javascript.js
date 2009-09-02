//--------------------------------------------------
// This section is code for the user list in the add_item popup


// toggles colors for list_users
jQuery.fn.toggle_selected = function () {
	return this.each( function() {
		
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

			// second evaluation is to control when color goes from maybe
			// to unselected. in that case, you want it to be unselected
			// rather than hover
			if ($(this).hasClass("hover") || $(this).hasClass('unselected')){
				$(this).removeClass("hover").removeClass('unselected').addClass("selected_yes").unbind('mouseover').unbind('mouseout'); 
				users_yes[id] = id;

			} else if ($(this).hasClass("selected_yes")){
				users_maybe[id] = id;
				users_yes[id] = 0;
				$(this).removeClass("selected_yes").addClass("selected_maybe");

			} else if ($(this).hasClass("selected_maybe")) {
				$(this).removeClass("selected_maybe").addClass('unselected'); 
				users_maybe[id] = 0;
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

// code for passing the selected user list information to backend
$(document).ready(function() {

	// initialize arrays for who is a 'yes' and who's a 'maybe'
	var num_users = $("#list_users span").length-1;

	// global variables. fix this!
	users_yes = new Array(num_users);
	users_maybe = new Array(num_users);
	for (var i = 0; i < num_users; i++){
		users_yes[i] = 0;
		users_maybe[i] = 0;
	}

	$('.option_text').toggle_selected();

	var status=0;
	$('#all_name').click(function() {
		$('.option_text').removeClass().addClass('option_text');
		if (status == 0){
			$('#all_name').addClass('selected_yes');
			$('.option_text').addClass('selected_yes');
			status = 1;
			for (i = 0; i < ($('.option_text').length - 1); i++){
				users_yes[i] = i;
			}
		}
		else {
			$('#all_name').removeClass('selected_yes');
			$('.option_text').addClass('unselected');
			status = 0;
			for (i = 0; i < ($('.option_text').length - 1); i++){
				users_yes[i] = 0;
			}
		}
	});
});

//-----------------------------------------
// this refreshes the item list. making it into a function so I can call it again when edits are made and we have to refresh on the fly
function loadItemList(){

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
			console.log('running');
			$.ajax({
				url: '/dtms/delete_item',
				data: {'delete_id': delete_id},
				type: 'POST',
				dataType: 'json',
				success: function(data){ loadItemList(); },
			});
		});
	
		// edit button behavior
		$(".edit").click(function(){
	
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
					for (x in data['users']){
						if (data['users'][x] == true){
							$('#' + x + 'option').addClass('selected_maybe').removeClass('unselected');
						} else {
							$('#' + x + 'option').addClass('selected_yes').removeClass('unselected');
						}
					}
	
					$('#dialog').jqmShow();
	
					// editing add_item form data
					$('#name').val(data['name']);
					$('#price').val(data['price']);
					$('#purch_date').val(data['purch_date']);
					$('#comments').val(data['comments']);
					$('#tags').val(data['tags']);
					$('#sub_tag').val(data['sub_tag']);
				},
			});
		});
	}

	$.ajax({
		url: '/dtms/list',
		success: function(data){
			$("#list").html(data)
			onListUpdate();
		}
	});
}


// scrapes form and submits to /add_item
function submitForm(){
	// gets all the information from the forms
	var str= $("#purch_date").val();
	var d = str.split("/");
	var data = {
		'name': $("#name").val(),
		'purch_date': d,
		'price': $("#price").val(),
		'buyer': 1,
		'users_yes': users_yes,
		'users_maybe': users_maybe,
		'comments': $("#comments").val(),
		'tags': $("#tags").val(),
		'sub_tag': $("#sub_tag").val(),
		'house_id': 1,
		'archive_id': 0,
	};

	// edit_id is a global variable used in list.html. fix this.
	// it's the id that's captured when you click on the item div and must be passed around
	
	if ($("#action").html() == 'edit')
		data = $.extend(data, {'edit_id': edit_id});

	var c = JSON.stringify(data);

	$.ajax({
		url: '/dtms/add_item', 
		type: "POST",
		data: {'string': c},
		success: function(data){
			$('#dialog').jqmHide();
		},
		error: function(xhr, ts, et){
			$('body').html(xhr.responseText);
			$('#dialog').jqmHide();
		}
	});

	// call the list again to reflect changes
	loadItemList();
}

// JS code for the add_item box (getting info from fields, sending it to django, and fade effect)
$(document).ready(function(){

	// load item list
	loadItemList();


	// make sure the submit button says the right thing. this gets changed when the user edits something
	$("#add_item").click(function(){
		$("#action").text('submit');
	});

	// item submit button
	$("#action").click(function(){
		submitForm();
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


