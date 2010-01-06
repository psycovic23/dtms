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
					$all_button.addClass('selected');
					$list_elements.addClass('selected');
					$all_button.data('status', 1);
					$list_elements.each(function(){
						var temp = $list.data('selected');
						temp[parseInt($(this).attr('id'))] = 1;
						$list.data('selected', temp);
					});
				} else {
					$all_button.removeClass('selected');
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
					$(this).removeClass("hover").removeClass('unselected').addClass("selected").unbind('mouseover').unbind('mouseout'); 
					temp = $list.data('selected');
					temp[id] = 1;
					$list.data('selected', temp);
				} else if ($(this).hasClass("selected")){
					temp = $list.data('selected');
					temp[id] = 0;
					$list.data('selected', temp);
					$(this).removeClass("selected").removeClass('hover').addClass("unselected");
					$(this).mouseover( function() {
						$(this).addClass("hover");
					});	
					$(this).mouseout( function() {
						$(this).removeClass("hover");
					}); 
				}

				if (multi == false){
					$list_elements.not(this).removeClass('selected').addClass("unselected").each(function(){
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
		$(this).removeClass("selected").addClass("unselected");
	}

	$.fn.return_names = function(){
		return $(this).data('selected');
	}

	$.fn.set_names = function(t){
		$(this).data('selected', t);
		for (x in t){
			if (t[x] != 0){
				$('#' + x + 'option').addClass('selected').removeClass('unselected');
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

	var options = {};
	$.extend(options, default_args, args);

	/* applies JS code to the item list that's dumped into the DOM.
	 * this function doesn't actually make the ajax call, it just applies what's needed once the call is made.
	 **/
	function onListUpdate(data, options){
		
		// load the data into mainContainer	
		$("#mainContainer").html(data);


		// add item button behavior
		$("#add_item").click(function(){
			loadAddItem();
		});


		// clear_cycle and delete_item jqmodal triggers
		$('#clearCyclePopup').jqm({trigger: 'a#clearCyclePopupButton'});
		$('#deleteItemPopup').jqm();

		/* clear_cycle behavior */
		$("#confirmClearCycle").click(function(){
			loadClearCycle();
		});

		// delete_item behavior for jqmodal box
		$("#confirmDeleteItem").click(function(){
			delete_id = $("#confirmDeleteItem").data('delete_id');
			$.ajax({
				url: '/dtms/delete_item',
				data: {'delete_id': delete_id},
				type: 'POST',
				dataType: 'json',
				success: function(data){ loadItemList(); },
				error: function(data){ document.write(data.responseText); }
			});
		});
		
		// delete button behavior for trash can icon
		$(".delete").click(function(){
			$("#confirmDeleteItem").data('delete_id', parseInt($(this).parent().attr('id')));
			$("#deleteItemPopup").jqmShow();
		});

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
	
	
		// edit button behavior
		$(".edit").click(function(){
			// this id corresponds to the unique id in the django db
			edit_id = parseInt($(this).parent().attr('id'));
			loadAddItem(edit_id);
		});



		/* archive list */
		$("select").change(function(){
			loadItemList({'archive_id': $(this).val()});
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

		/* houseMode button code */
		if (options['houseMode'] == 1){
			$("#house").addClass('selected');
			$("#your").css('cursor', 'pointer');
		} else {
			$("#your").addClass('selected');
			$("#house").css('cursor', 'pointer');
		}
		$(".houseMode").click(function(){
			if (!$(this).hasClass('selected')){
				$("#graph").remove();
				loadItemList({'houseMode': (options['houseMode'] + 1) % 2, 'archive_id':$("#archive_id").html()});
				$("#sidepanel").css('display', 'none');
			}
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
	// determine what archive list to load, based on arguments from options
	var url_str = '/dtms/item_list';
	url_str += '/' + options['archive_id'] + '/' + options['houseMode'] + '/';

	$.ajax({
		url: url_str,
		success: function(data){
			// maybe throw these back into the config function
			onListUpdate(data, options);
		},
		error: function(data){
			document.write(data.responseText);
		}
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
		var purch_date_str= $("#purch_date").val();
		var purch_date = purch_date_str.split("/");
		var tag;
		var quit = 0;

		// prevent submitting twice
		$('#action').data('status', 0);

		// error check price
		$('.number').each(function(){
			var t = $(this).val();
			if (t.match(/[^\d\.]/) != null){
				alert('recheck your prices');
				$("#action").data("status", 1);
				quit = 1;
				return;
			}
		});
		
		if (quit == 1)
			return;

		// error check date
		if (purch_date_str.match(/[^\d\/]/) != null || 
				parseInt(purch_date[1]) > 12 || parseInt(purch_date[1]) < 1 || 
				parseInt(purch_date[2]) < 1 || parseInt(purch_date[2]) > 31 ||
				parseInt(purch_date[0]) < 2009 || parseInt(purch_date[3]) > 2012){
			alert("check your dates again");
			$("#action").data("status", 1);
			return;
		}

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
					return;
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
	$.ajax({
		url: '/dtms/addItem',
		dataType: 'json',
		success: function(data){
			$("#mainContainer").html(data['html']);

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
}

/* graph code - json call is made by jquery tabs */
function loadGraphs(args){
	var default_args = {
		'archive_id':	'0',
		'houseMode':	'0'
	}

	var options = {};
	$.extend(options, default_args, args);

	$("select").unbind("change").change(function(){
		loadGraphs({'archive_id': $(this).val()});
	});
	$("#graph").remove();
	$("#graphContainer").append("<div id='graph'></div>");
	var url_str = '/dtms/graphData/' + options['archive_id'] + '/' + options['houseMode'] + '/';
	$.ajax({
		url: url_str,
		dataType: 'json',
		success: function(data){
			if (data['categories'].length > 0){
				var chart1 = new Highcharts.Chart({
					chart: {
						renderTo: 'graph',
						defaultSeriesType: 'column',
						width:600,
						height:500,
						margin: [50,50,100,80]
					},
					title: {
						text: data['display_date']
					},
					credits: {
						enabled: false
					},
					xAxis: {
						categories: data['categories'],
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
						data: data['series'],
						dataLabels: {
							enabled: false
						}
					}]
				});
			}

			/* houseMode button code */
			if (options['houseMode'] == 1){
				$("#house_graph").addClass('selected');
				$("#your_graph").removeClass('selected').css('cursor', 'pointer');
			} else {
				$("#your_graph").addClass('selected');
				$("#house_graph").removeClass('selected').css('cursor', 'pointer');
			}
			$(".houseMode_graph").unbind('click');
			$(".houseMode_graph").click(function(){
				if (!$(this).hasClass('selected')){
					// change this later
					loadGraphs({'houseMode': (options['houseMode'] + 1) % 2, 'archive_id': options['archive_id']});
				}
			});
		},
		error: function(xhr){ document.write(xhr.responseText); }
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

$(document).ready(function(){

//---------------- JS code for index page -------------------

	$("#tabs").tabs({
		load: function(event, ui){
			// dunno why
			$(".yui-ge").remove();
			var $tabs = $('#tabs').tabs();
			var selected = $tabs.tabs('option', 'selected');
			if (selected == 0)
				loadItemList();
			if (selected == 1){
				loadGraphs();
			}
		},
	});
});
