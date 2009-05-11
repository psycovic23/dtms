from django.db import models
import datetime

class User(models.Model):
	name = models.CharField(max_length=30)
	email = models.EmailField(max_length=75)
	house_id = models.PositiveIntegerField()
	password = models.CharField(max_length=50)

	def __unicode__(self):
		return self.name

class Item(models.Model):
	name = models.CharField(max_length=40)
	purch_date = models.DateField(default=datetime.datetime.now())
	date_added = models.DateTimeField(auto_now_add=True)
	price = models.DecimalField(max_digits=6, decimal_places=2)
	buyer = models.IntegerField()
	users_yes = models.CommaSeparatedIntegerField(max_length=10)
	users_maybe = models.CommaSeparatedIntegerField(max_length=10)
	comments = models.CharField(default='',max_length=400)
	tags = models.CharField(default='',max_length=100)
	house_id = models.IntegerField()

	# for archiving purposes
	session_id = models.IntegerField()


