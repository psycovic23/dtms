from django.conf.urls.defaults import *
from mysite.views import * 

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    (r'^tag_price$', 'mysite.dtms.views.tag_price'),
	(r'^adduser$', 'mysite.dtms.views.adduser'),
	(r'^adduser_run$', 'mysite.dtms.views.adduser_run'),
	(r'^list_items$', 'mysite.dtms.views.list_items'),
	(r'^list$', 'mysite.dtms.views.list'),
	(r'^$', 'mysite.dtms.views.index'),
	(r'^ind_calc$', 'mysite.dtms.views.individual_bill'),
	(r'^login$', 'mysite.dtms.views.login'),
	(r'^add_item$', 'mysite.dtms.views.add_item'),
	(r'^edit_item$', 'mysite.dtms.views.edit_item'),
	(r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root': '/home/victor/Programming/django/mysite/includes'}),
)

