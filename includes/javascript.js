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
			console.log(users_yes, users_maybe);
		});
	});
}

$(document).ready(function() {

	// initialize arrays for who is a 'yes' and who's a 'maybe'
	var num_users = $("#list_users span").length-1;
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

$(document).ready(function(){

	// coupling with list.html
	//

	$("#tabs").tabs();
	$("#add_item").click(function(){
		$("#action").text('submit');
	});

	// item submit button
	$("#action").click(function(){

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
		// make sure edit_id is pointing to item_node id, not item_model
		
		if ($("#action").html() == 'edit')
			data = $.extend(data, {'edit_id': edit_id});

		var c = JSON.stringify(data);

		$.ajax({
			url: '/add_item', 
			type: "POST",
			data: {'string': c},
			success: function(data){
				$('#dialog').jqmHide();
				refresh();
			},
			error: function(xhr, ts, et){
				$('body').html(xhr.responseText);
				$('#dialog').jqmHide();
			}
		});

	});
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


function refresh(){
	$('#tabs').tabs('load',0);
	console.log('refresh');
}
