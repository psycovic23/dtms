from django.conf.urls.defaults import *
from views import * 

# Uncomment the next two lines to enable the admin:
    #from django.contrib import admin
    #admin.autodiscover()

urlpatterns = patterns('',
    # non app stuff
	(r'^signup$', adduser),
    (r'^read$', read),
	(r'^login$', login),

    # first tab - items. fix naming later
    (r'^addItem$', addItemPage),
	(r'^add_item$', add_item),
    (r'^item_list$', item_list),
	(r'^item_list/(?P<a_num>\d+)/$', item_list),
	(r'^item_list/(?P<a_num>\d+)/(?P<houseMode>\d+)/$', item_list),
    (r'^clear_cycle$', clear_cycle),
    (r'^delete_item$', delete_item),
	(r'^edit_item$', edit_item),

    # second tab - graphs
    (r'^graphs$', graphs),
	(r'^graphData$', graphData),
	(r'^graphData/(?P<a_num>\d+)/(?P<houseMode>\d+)/$', graphData),

    # third tab - shopping list
    (r'^addSLItem$', addSLItem),
    (r'^shoppingList$', shoppingList),
    (r'^createList$', createList),
    (r'^editSLItem$', editSLItem),
    (r'^deleteSL$', deleteSL),

	(r'^$', index),
    (r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root':
                       '/home/victor/Dropbox/Programming/django/mysite/dtms/static'}),
)

