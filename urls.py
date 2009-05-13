from django.conf.urls.defaults import *
from mysite.views import * 

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
	(r'^adduser$', 'mysite.dtms.views.adduser'),
	(r'^adduser_run$', 'mysite.dtms.views.adduser_run'),
	(r'^$', 'mysite.dtms.views.index'),
	(r'^login$', 'mysite.dtms.views.login'),
	(r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root': '/home/victor/django_projects/mysite/includes'}),
)

#urlpatterns = patterns('',
    # Example:
    #	(r'^mysite/', include('mysite.foo.urls')),

    # Uncomment the admin/doc line below and add 'django.contrib.admindocs' 
    # to INSTALLED_APPS to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
#	(r'^admin/(.*)', admin.site.root),
#)
