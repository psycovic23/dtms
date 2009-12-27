/* toggle_selected plugin - toggles colors for list_users
 * if multi is true, then we can select multiple names from the list */
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

// ------------------------------------------------


/* this refreshes the item list in the right panel. 
 * takes in the archive_id and housemode, only two things needed.
 * defaults to current archive_id and usermode
 * */

function loadItemList(args){
	var default_args = {
		'archive_id':	'0',
		'houseMode':	'0'
	}

	options = {};
	$.extend(options, default_args, args);

	/* applies JS code to the item list that's dumped into the DOM.
	 * this function doesn't actually make the ajax call, it just applies what's needed once the call is made.
	 **/
	function onListUpdate(data, options){
		
		// load the data into rightPanel	
		$("#rightPanel").html(data['html']).fadeIn("fast");


		/* code for row behaviors in table */

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



		/* tag list code */

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



		/* graph code */

		var graphdata = eval(data['graphData']);
		console.log(graphdata);

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


		/* houseMode button code */
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

	/* makes the ajax call, then calls onListUpdate to make everything pretty */
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


/* scrapes form and submits to /add_item */
function submitForm(list_users, list_buyers){

	/* scrapes a div containing input fields and stores the values into an array */
	function getArrayFromInputFields(id){
		var values = [];
		var $d = $("#" + id + " input");
		$d.each(function(){
			values.push([parseInt($(this).attr('id')),$(this).val()]);
		});
		return values;
	}

	/* sums an array */
	function sum(a){
		var sum = 0;
		for (x in a){
			sum += parseFloat(a[x][1]);
		}
		return sum;
	}

	/* start the scraping of the form and processing.
	 * when $("#action").data('status') == 1, that means the button is active */
	if ($('#action').data('status') == 1){
		// gets all the information from the forms
		var str= $("#purch_date").val();
		var purch_date = str.split("/");
		var tag;

		// prevent submitting twice
		$('#action').data('status', 0);


		// default tag name is uncategorized
		if ($("#tags").val() == '')
			tag = "Uncategorized";
		else
			tag = $("#tags").val();

		// data stores most info in the form
		var data = {
			'name': $("#name").val(),
			'purch_date': purch_date,
			'price': $("#price").val(),
			'buyer': 1,
			'comments': $("#comments").val(),
			'tags': tag.toLowerCase(),
			'sub_tag': $("#sub_tag").val(),
			'archive_id': 0,
		};

		/* if we're in basic mode, where user is not manually inputting payment.
		 * note - this is really just doing the calculations and putting it into the advanced payment fields.
		 * it does this by looking at #price, dividing it by the total number of users, then putting it into each person's field.
		 * This ind_p is rounded, then multiplied to get a usable price to insert for the buyer.
		 * #price doesn't do anything at the moment. */

		// if buyers are not expanded,
		// if we're not editing, don't fill anything in. if we are, and we're in basic mode, calculate new rounded price
		// there's pretty stupid code here.
		var uid = 0;
		if ($("#action").html() != 'edit' && $("#expanded_buyers").css('display') == "none"){
			var a = list_buyers.return_names();
			var counter = 0;

			// technically don't need to do this because "a" will only have one buyer
			for (t in a){
				if (a[t]){
					//$("#" + parseInt(t) + "eb").val(Math.round(ind_p * list_users.number_of_selected()*100)/100);
					$("#" + parseInt(t) + "eb").val($("#price").val());
					uid = parseInt(t);
					counter++;
				}
			}
			if (counter != 1){
				alert('something is wrong, buyer has multiple');
			}

		}

		if ($("#expanded_users").css('display') == "none"){
			// assert that there is only one buyer value
			var buyer_total = sum(getArrayFromInputFields("expanded_buyers")) 
			if ($("#expanded_buyers").css('display') == "none"){
				if ( buyer_total != $("#" + uid + "eb").val()){
					alert('something broke');
				}
			}

			var ind_p = Math.round(100 * buyer_total / list_users.number_of_selected())/100;

			// the "new" price
			$("#" + uid + "eb").val(Math.round(ind_p * list_users.number_of_selected()*100)/100);

			// fill in each user's payment amount
			var a = list_users.return_names();
			for (t in a){
				if (a[t])
					$("#" + parseInt(t) + "eu").val(ind_p);
			}

			//if ($("#action").html() != 'edit' && $("#expanded_buyers").css('display') == 'none')
			//	$("#" + uid + "eb").val(Math.round(ind_p * list_users.number_of_selected()*100)/100);

		} 


		// fill in price with new calculated prices
		data['price'] = (sum(getArrayFromInputFields("expanded_buyers")));
		
		// if we're editing, also submit the edit_id along with everything
		if ($("#action").html() == 'edit')
			data = $.extend(data, {'edit_id': edit_id});

		// attach arrays containing amounts people pay
		data = $.extend(data, {'expanded_buyers': getArrayFromInputFields("expanded_buyers")});
		data = $.extend(data, {'expanded_users': getArrayFromInputFields("expanded_users")});

		// error checking - if amount paid != amount owed
		if (Math.round(sum(getArrayFromInputFields("expanded_buyers"))*100)/100 != Math.round(sum(getArrayFromInputFields("expanded_users"))*100)/100){
			alert("the amount people paid and the amount people owe don't add up. check the values in the 'breakdown payments' sections");
			$("#action").data('status',1);
			return;
		}

		// error checking - if price = 0
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

/* loads the additem page */
function loadAddItem(edit_id){

	// sets all input fields to zero
	function setFieldsToZero(){
		$("#expanded_buyers input").val(0);
		$("#expanded_users input").val(0);
	}

	/* again, does all the js stuff, but doesn't make the ajax call */
	function addItemConfigure(data){
		// create the basic_user listing by using the toggle_selected plugin
		var $list_users = $('#list_users').toggle_selected(true);
		var $list_buyers = $("#list_buyers").toggle_selected(false);

		setFieldsToZero();

		// autocomplete plugin for typing into the tag field
		$("#tags").autocomplete(data['tags']);
	
		// make the breakdown payment buttons
		$("#b_buyer").toggle(function(){
			$("#basic_buyers").css("display", "none");
			$("#expanded_buyers").css("display", "inline");
			$("#price").css("display", "none");
			$("#basic_users").css("display", "none");
			$("#expanded_users").css("display", "inline");
			$("#b_user").css("display", "none");
		}, function() {
			$("#expanded_buyers").css("display", "none");
			$("#basic_buyers").css("display", "inline");
			$("#price").css("display", "inline");
			$("#expanded_users").css("display", "none");
			$("#basic_users").css("display", "inline");
			$("#b_user").css("display", "inline");
		});

		$("#b_user").toggle(function(){
			$("#basic_users").css("display", "none");
			$("#expanded_users").css("display", "inline");
		}, function() {
			$("#expanded_users").css("display", "none");
			$("#basic_users").css("display", "inline");
		});

		// initially hide expanded sections
		$("#expanded_buyers").css('display', 'none');
		$("#expanded_users").css('display', 'none');
	
		// item submit button - set to be active
		$("#action").click(function(){
			submitForm($list_users, $list_buyers);
		});
		$("#action").data('status', 1);


		// cancel button brings us back to itemlist
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

	/* makes the ajax call to load additem. lots of code if we're editing an item */
	$("#rightPanel").fadeOut("fast", function(){
		$.ajax({
			url: '/dtms/addItem',
			dataType: 'json',
			success: function(data){
				$("#rightPanel").html(data['html']).fadeIn("fast");

				// initialization steps - make action active, clear fields and plugin, configure DOM obj
				$("#action").text('submit');
				setFieldsToZero();
				$list_users = addItemConfigure(data);
				$list_users.clear_names();
	
				/* if we're editing an item, as opposed to creating a new one.
				 * the difference here is that we have to load all of the previous data. */
				if (edit_id !== undefined){
					setFieldsToZero();
					$list_users.clear_names();
	
					// change the action button to say "edit". also remove breakdown button
					$("#action").text('edit');
					$("#b_buyer").remove();
					$("#b_user").remove();
	
					/* if we're editing, make ajax call to get data we need to fill in fields */
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

/* clear fiscal period */
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
