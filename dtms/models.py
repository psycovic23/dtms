from django.db import models
from django.utils import simplejson as json
import operator
import pdb
import datetime
from dtms.item_list import *

class User(models.Model):
    name        = models.CharField(max_length=30)
    email       = models.EmailField(max_length=75)
    house_id    = models.PositiveIntegerField()
    password    = models.CharField(max_length=50)

    def __unicode__(self):
        return self.name

class Tag(models.Model):
    name    = models.CharField(max_length=50)
    house_id = models.PositiveIntegerField()

    def __unicode__(self):
        return self.name

    def cat_price(self):
        t = self.user_set.all()
        total_price = 0
        for x in t:
            total_price += x.price
        return [str(self.name), float(total_price)]

# all item_model revisions attach to this. this attaches to item_status
class Item(models.Model):

    # for archiving purposes
    archive_id  = models.IntegerField()
    users       = models.ManyToManyField(User, through='User_item_rel',
                                         related_name='users_set')

    # for many to one relationship (tags)
    tag         = models.ForeignKey(Tag)
    sub_tag     = models.CharField(default='',max_length=40)

    name        = models.CharField(max_length=40)
    purch_date  = models.DateField(default=datetime.datetime.now())
    date_edited = models.DateTimeField(auto_now_add=True)
    price       = models.DecimalField(max_digits=6, decimal_places=2)
    buyer       = models.ManyToManyField(User, through='Buyer_item_rel',
                                         related_name='buyers_set')
    comments    = models.CharField(default='',max_length=400)
    house_id    = models.IntegerField()
    
    # for editing
    def delete_m2m_links(self):
        self.user_item_rel_set.all().delete()
        self.buyer_item_rel_set.all().delete()

    def tag_name(self):
        return self.tag

    def sub_tag_name(self):
        return self.sub_tag

    def __unicode__(self):
        return self.name



# defining many-to-many relationship between User and Item
class User_item_rel(models.Model):
    user            = models.ForeignKey(User)
    item            = models.ForeignKey(Item)
    maybe_buying    = models.BooleanField() # true means maybe buying, EXCLUDES BUYERS
    payment_amount  = models.DecimalField(max_digits=6, decimal_places=2)
    date_added      = models.DateTimeField(auto_now_add=True)

    def __unicode__(self):
        return str([str(self.user), str(self.item)])

class Buyer_item_rel(models.Model):
    buyer           = models.ForeignKey(User)
    item            = models.ForeignKey(Item)
    payment_amount  = models.DecimalField(max_digits=6, decimal_places=2)
    date_added      = models.DateTimeField(auto_now_add=True)

    def __unicode__(self):
        return str([str(self.buyer), str(self.item)])

# database-independent models
# typeof(list) = [ Item ]
