//--------------------------------------------------
// This section is code for the user list in the add_item popup


// toggle_selected plugin - toggles colors for list_users
(function($) {		
	$.fn.toggle_selected = function(multi){

		if (multi === undefined){
			var multi = true;
		}
			
		var $list = this;
		$list.data('selected', {});
		var $list_elements = $('li', this);

		if (multi == true){
			var $all_button = $('<li>All</a>');
			$all_button.data('status', 0);
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
				$list_elements.removeClass();
				if ($all_button.data('status') == 0){
					$all_button.addClass('selected_yes');
					$list_elements.addClass('selected_yes');
					$all_button.data('status', 1);
					$list_elements.each(function(){
						var temp = $list.data('selected');
						temp[parseInt($(this).attr('id'))] = 1;
						$list.data('selected', temp);
					});
				} else {
					$all_button.removeClass('selected_yes');
					$list_elements.addClass('unselected');
					$all_button.data('status', 0);
					$list_elements.each(function(){
						var temp = $list.data('selected');
						temp[parseInt($(this).attr('id'))] = 0;
						$list.data('selected', temp);
					});
				}
			});
		}
		
		// each element of list behavior
		$list_elements.each( function() {
			
			var temp = $list.data('selected');
			temp[parseInt($(this).attr('id'))] = 0;
			$list.data('selected', temp);

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
				if ($(this).hasClass('unselected')){
					$(this).removeClass("hover").removeClass('unselected').addClass("selected_yes").unbind('mouseover').unbind('mouseout'); 
					temp = $list.data('selected');
					temp[id] = 1;
					$list.data('selected', temp);
				} else if ($(this).hasClass("selected_yes")){
					temp = $list.data('selected');
					temp[id] = 0;
					$list.data('selected', temp);
					$(this).removeClass("selected_yes").removeClass('hover').addClass("unselected");
					$(this).mouseover( function() {
						$(this).addClass("hover");
					});	
					$(this).mouseout( function() {
						$(this).removeClass("hover");
					}); 
				}

				if (multi == false){
					$list_elements.not(this).removeClass('selected_yes').addClass("unselected").each(function(){
						temp = $list.data('selected');
						temp[parseInt($(this).attr('id'))] = 0;
						$list.data('selected', temp);
					});
				}
			});
		});
		return $list;
	}

	$.fn.clear_names = function(){
		$(this).removeClass("selected_yes").addClass("unselected");
	}

	$.fn.return_names = function(){
		return $(this).data('selected');
	}

	$.fn.set_names = function(t){
		$(this).data('selected', t);
		for (x in t){
			if (t[x] != 0){
				$('#' + x + 'option').addClass('selected_yes').removeClass('unselected');
			}
		}
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

		return nnz($(this).data('selected'));
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
		'houseMode':	'0'
	}

	options = {};
	$.extend(options, default_args, args);

	// applies JS code to the item list that's dumped into the DOM
	function onListUpdate(data, options){
		
		// load the data into rightPanel	
		$("#rightPanel").html(data['html']).fadeIn("fast");

		// fancy actions for clicking on an item in the items list
		// it reveals the item_description tr and stops the hover coloring
		$(".item").toggle(
			function(){
				$(this).css({'borderBottom': 0});
				$(this).next().show();
				$(this).unbind('mouseover').unbind('mouseout').css({'background-color': '#fff'});
			}, function() {
				$(this).next().hide();
				$(this).css({'borderBottom': '1px #ccc solid'});
				$(this).bind('mouseover', function(){
					$(this).css({'background-color': '#ffc97c'});})
				.bind('mouseout', function(){
					$(this).css({'background-color': '#fff'});
				});
			});

		// hide item_description on load
		$(".item_description").hide();
	
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


		$('#tagList').hide();
		// dropdown taglist
		$('#toggleTagList').toggle(function(){
			$('#tagList').slideDown('fast');
		}, function(){
			$('#tagList').slideUp('fast');
		});

		// filtering for tag list
		$(".tagNames").click(function(){
			if ($(this).html() == "all"){
				$("tr.item").show();
			} else {
				if ($("td.tag:contains('" + $(this).html() + "')").length != 0){
					$("td.tag:contains('" + $(this).html() + "')").parent().show();
					$("td.tag:not(:contains('" + $(this).html() + "'))").parent().hide();
				}
			}
		})



		// graph stuff
		var graphdata = eval(data['graphData']);

		$("#graph").hide();
		var chart1 = 0;
		$("#showAnalysis").toggle(function(){
			$("#graph").show();
			if (chart1 == 0){
				chart1 = new Highcharts.Chart({
					chart: {
						renderTo: 'graph',
						defaultSeriesType: 'column',
						height: 200,
						margin: [50,50,100,80]
					},
					title: {
						text: "let's see where that all went..."
					},
					xAxis: {
						categories: graphdata[0]['categories'],
						labels: {
							rotation: -45,
							align: 'right',
							style: {
								font: 'normal 13px georgia, sans-serif'
							}
						}
					},
					yAxis: {
						min: 0,
						title: {
							text: '$'
						}
					},
					legend: {
						enabled: false
					},
					tooltip: {
						formatter: function(){
							return '<b>'+ this.x + ': $' + this.y + '</b><br/>';
						}
					},
					series: [{
						name: 'money',
						data: graphdata[0]['series'],
						dataLabels: {
							enabled: false
						}
					}]
				});
			}
			//$("#graph").slideDown('slow');
			//$(this).val('hide analysis')
		}, function(){
			$("#graph").slideUp('slow');
		});

		// show house mode button
		if (options['houseMode'] == 1)
			$("#houseMode").html('<img src="../static/images/person_20px.png" />');
		else
			$("#houseMode").html('<img src="../static/images/house_20px.png" />');
		$("#houseMode").click(function(){
			loadItemList({'houseMode': (options['houseMode'] + 1) % 2, 'archive_id':$("#archive_id").html()});
		});


		// this is for clicking on names in house mode and highlighting items
		$("td.hoverable").click(function(){
			if (options['houseMode'] == 1){
				if ($(".item_description:contains('" + $(this).html() + "')").length != 0){
					$(".item_description:contains('" + $(this).html() + "')")
						.prev().css({'backgroundColor': '#ffc97c'});
					$(".item_description:not(:contains('" + $(this).html() + "'))")
						.prev().css({'backgroundColor': '#fff'});
				}
			}
		});

	}


	// call to run Config function
	$("#rightPanel").fadeOut("fast", function(){
		// determine what archive list to load, based on arguments from options
		
		var url_str = '/dtms/item_list';
		url_str += '/' + options['archive_id'] + '/' + options['houseMode'] + '/';

		$.ajax({
			url: url_str,
			dataType: 'json',
			success: function(data){
				// maybe throw these back into the config function
				onListUpdate(data, options);
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

	function sum(a){
		var sum = 0;
		for (x in a){
			sum += parseFloat(a[x][1]);
		}
		return sum;
	}

	// 1 is when button is active
	if ($('#action').data('status') == 1){
		// gets all the information from the forms
		var str= $("#purch_date").val();
		var d = str.split("/");
		var tag;

		// prevent submitting twice
		$('#action').data('status', 0);


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
			'tags': tag.toLowerCase(),
			'sub_tag': $("#sub_tag").val(),
			'archive_id': 0,
		};

		// this only works for users_yes, not the maybe part	
		if ($("#expanded_users").css('display') == "none"){
			var uid = $("#uid").html();
			var p = $("#price").val();
			var ind_p = Math.round(100 * p / list_users.number_of_selected())/100;

			if ($("#action").html() != 'edit' && $("#expanded_buyers").css('display') == 'none')
				$("#" + uid + "eb").val(Math.round(ind_p * list_users.number_of_selected()*100)/100);

			data['price'] = String(ind_p * list_users.number_of_selected()); 
			var a = list_users.return_names();
			for (t in a){
				if (a[t])
					$("#" + parseInt(t) + "eu").val(ind_p);
			}
		} else {
			data['price'] = (sum(getArrayFromInputFields("expanded_buyers")));
		}


		if ($("#action").html() == 'edit')
			data = $.extend(data, {'edit_id': edit_id});

		data = $.extend(data, {'expanded_buyers': getArrayFromInputFields("expanded_buyers")});
		data = $.extend(data, {'expanded_users': getArrayFromInputFields("expanded_users")});

		if (sum(getArrayFromInputFields("expanded_buyers")) != Math.round(sum(getArrayFromInputFields("expanded_users"))*100)/100){
			alert("the amount people paid and the amount people owe don't add up. check the values in the 'breakdown payments' sections");
			$("#action").data('status',1);
			return;
		}

		if (sum(getArrayFromInputFields("expanded_buyers")) == 0){
			alert("apparently this item costs 0 dollars. are you sure?");
			$("#action").data('status',1);
			return;
		}

		// submit data
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
}


function loadAddItem(edit_id){
	function addItemConfigure(data){
		// load item list
		var $list_users = $('#list_users').toggle_selected(true);
		setFieldsToZero();

		$("#tags").autocomplete(data['tags']);
		var $list_buyers = $("#list_buyers").toggle_selected(false);
	
		// make the advanced selection buttons
		$("#b_buyer").toggle(function(){
			$("#basic_buyers").css("display", "none");
			$("#expanded_buyers").css("display", "inline");
		}, function() {
			$("#expanded_buyers").css("display", "none");
			$("#basic_buyers").css("display", "inline");
		});

		$("#b_user").toggle(function(){
			$("#basic_users").css("display", "none");
			$("#expanded_users").css("display", "inline");
		}, function() {
			$("#expanded_users").css("display", "none");
			$("#basic_users").css("display", "inline");
		});

		// hide expanded sections
		$("#expanded_buyers").css('display', 'none');
		$("#expanded_users").css('display', 'none');
	
		// item submit button
		$("#action").click(function(){
			submitForm($list_users);
		});

		// set action button to be active
		$("#action").data('status', 1);

		$("#cancel").click(function(){
			loadItemList();
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
		
							// editing add_item form data
							$('#name').val(data['name']);
							$('#price').val(data['price']);
							$('#purch_date').val(data['purch_date']);
							$('#comments').val(data['comments']);
							$('#tags').val(data['tags']);
							for (x in data['ind_pay']){
								$("#" + x + "eu").val(data['ind_pay'][x]);
							}
							
							for (x in data['buyer_pay'])
								$("#" + x + "eb").val(data['buyer_pay'][x]);
	
							$("#expanded_buyers").css("display", "inline");
							$("#expanded_users").css("display", "inline");
							$("#basic_buyers").css("display", "none");
							$("#basic_users").css("display", "none");
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
	$('#clearCyclePopup').jqm({trigger: 'a#newCycleMenu'});

//---------------- JS code for index page -------------------

	// load item list on page load
	loadItemList();

	// button calls

	$("#confirmClearCycle").click(function(){
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
