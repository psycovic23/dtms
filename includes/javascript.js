
var num_users = $("#list_buyers span").length;
var users_yes = new Array(num_users);
var users_maybe = new Array(num_users);
for (var i = 0; i < num_users; i++){
	users_yes[i] = 0;
	users_maybe[i] = 0;
}
// list of buyers
jQuery.fn.toggle_selected = function (more_than_two) {
	return this.each( function() {
		$(this).unbind('mousedown');
		$(this).mousedown( function(){
			console.log('mousedown');
			if ($(this).hasClass("unselected")){
				console.log('unselected running');
				$(this).removeClass("unselected").addClass("selected_red"); 
				users_yes[parseInt($(this).attr('id'))] = 1;
			}
			else if ($(this).hasClass("selected_red")){
				console.log('selected_red');
				if (more_than_two){
					users_maybe[parseInt($(this).attr('id'))] = 1;
					users_yes[parseInt($(this).attr('id'))] = 0;
					console.log('selected_red morethantwo');
					$(this).removeClass("selected_red").addClass("selected_yellow");
				}
			} else if ($(this).hasClass("selected_yellow")) {
				console.log('running');
				$(this).removeClass("selected_yellow").addClass("unselected"); 
			}
		});
		$(this).unbind('mouseover').unbind('mouseout');
		console.log(users_yes, users_maybe);
	});
}

jQuery.fn.toggle_unSelected = function () {
	return this.each( function() {
			$(this).removeClass("selected_red").addClass("unselected");
			$(this).mouseover( function() {
				$(this).removeClass("unselected").addClass("selected_red");
			});	
			$(this).mouseout ( function() {
				$(this).removeClass("selected_red").addClass("unselected");
			});
	});
}

var buyer = -1;
// selecting one single buyer
$(document).ready(function() {
	$('.option_text_single').toggle_unSelected();
	$('.option_text_single').click(function(){
		$('.option_text_single').not(this).toggle_unSelected();
		$(this).toggle_selected();
		buyer = $(this).attr('id');
	});
}); 

// function for selecting multiple people who are using an item
$(document).ready(function(){

	$('.option_text').addClass('unselected').click(function(){
		$(this).toggle_selected(1);
	});
//	$('.option_text').toggle_unSelected();
//	$('.option_text').toggle(function() {
//		$(this).toggle_selected(1);
//		users_yes[parseInt($(this).attr('id'))] = 1;
//		},
//		function(){
//		$(this).toggle_unSelected();
//		users_yes[parseInt($(this).attr('id'))] = 0;
//	});
	var status=0;
	$('#all_name').click(function() {
		if (status == 0){
			$('.option_text').toggle_selected();
			status = 1;
			for (i = 0; i < ($('.option_text').length - 1); i++){
				users_yes[i] = 1;
			}
		}
		else {
			$('.option_text').toggle_unSelected();
			status = 0;
			for (i = 0; i < ($('.option_text').length - 1); i++){
				users_yes[i] = 0;
			}
		}
	});
});

$(document).ready(function(){

	$("#submit").click(function(){
		var str= $("#purch_date").val();
		var d = str.split("/");
		var data = {
			'name': $("#name").val(),
			'purch_date': d,
			'price': $("#price").val(),
			'buyer': buyer,
			'user': users,
			'comments': $("#comments").val(),
			'tags': $("#tags").val(),
			'house_id': 1,
			'session_id': 0
				
		};
		var c = JSON.stringify(data);
		$.ajax({
			url: '/',
			type: "POST",
			data: {'string': c},
			dataType: "json",
			success: function(data){
				$("#content").html(data);
			},
			error: function(xhr, ts, et){
				console.log(xhr);
				$("#content").html(xhr.responseText);
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
	var str = month + "/" + day + "/" + year;

	$('#purch_date').val(str);

	var myOpen=function(hash){ hash.w.fadeIn('1600')}; 
	$('#dialog').jqm({onShow: myOpen}).jqmAddTrigger('.openjqm');
});
