from django.conf.urls.defaults import *
from views import * 

# Uncomment the next two lines to enable the admin:
    #from django.contrib import admin
    #admin.autodiscover()

urlpatterns = patterns('',
	(r'^adduser$', adduser),
    (r'^addItem$', addItemPage),
    (r'^list$', list),
	(r'^list/(?P<a_num>\d+)/$', list),
	(r'^list/(?P<a_num>\d+)/(?P<houseMode>\d+)/$', list),
    (r'^showArchives$', showArchives),
	(r'^$', index),
    (r'^clear_cycle$', clear_cycle),
	(r'^login$', login),
	(r'^add_item$', add_item),
    (r'^delete_item$', delete_item),
	(r'^edit_item$', edit_item),
    (r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root':
                       '/home/victor/Programming/django/mysite/includes'}),
)

