from django.conf.urls.defaults import *
from views import * 

# Uncomment the next two lines to enable the admin:
    #from django.contrib import admin
    #admin.autodiscover()

urlpatterns = patterns('',
    (r'^tag_price$', tag_price),
	(r'^adduser$', adduser),
	(r'^list$', list),
	(r'^$', index),
	(r'^ind_calc$', individual_bill),
    (r'^tag_breakdown/(\d+)/$', tag_breakdown),
    (r'^getTagList$', getTagList),
    (r'^clear_cycle$', clear_cycle),
	(r'^login$', login),
	(r'^add_item$', add_item),
    (r'^delete_item$', delete_item),
	(r'^edit_item$', edit_item),
    (r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root':
                       '/home/victor/Programming/django/mysite/includes'}),
)

