from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from models import User

@require_http_methods(["POST"])
def create_user(request):
	"""Creates a new user and puts it into the DB"""
	   user = User(name = request.POST["name"], email = request.POST["email"], house_id = request.POST["house_id"], password = request.POST["password"]);
	   user.save()
	return HttpResponse("{'success': 'added user'}", mimetype="application/json")

