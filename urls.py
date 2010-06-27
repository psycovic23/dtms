from django.conf.urls.defaults import *

# go into the dtms app
from dtms.views import * 
from sms.views import process_sms
import gal.views as gal

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    #admin
    (r'^admin/', include(admin.site.urls)),
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

    # sms
    (r'^sms/(?P<sms_string>.+)/$', process_sms),

	(r'^$', index),


    # gal
    (r'^gal$', gal.index),
    (r'^gal/process/$', gal.process),
    (r'^gal/edit_pic/(?P<id>\d+)/$', gal.edit_pic),
    (r'^gal/view_pic/(?P<id>\d+)/$', gal.view_pic),
    (r'^gal/save/$', gal.save),
    (r'^gal/viewer/(?P<category>\w+)/(?P<pageNumber>\d+)/$', gal.innerviewer),
    (r'^gal/display/(?P<category>\w+)/$', gal.display),
    (r'^gal/display/(?P<category>\w+)/(?P<pageNumber>\d+)/$', gal.display),
)

if not settings.PROD:
    urlpatterns += patterns('', 
        (r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root':\
                       '/home/victor/dropbox/Programming/django/mysite/static'}),
                           )

