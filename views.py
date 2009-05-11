from django.http import HttpResponse
import datetime

def current_datetime(request, accept):
	#now = datetime.datetime.now()
	html = "<html><body>%s %s</body></html>" % (now,accept)
	return HttpResponse(html)
