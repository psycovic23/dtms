from django.db import models
from django.utils import simplejson as json
import operator
import pdb
import datetime

class User(models.Model):
    name        = models.CharField(max_length=30)
    email       = models.EmailField(max_length=75)
    house_id    = models.PositiveIntegerField()
    password    = models.CharField(max_length=50)

    def __unicode__(self):
        return self.name

class Item_list:

    def __init__(self, list = None, house_id = None, user_id = None):
        self.list = list
        self.house_id = house_id
        self.uid = int(user_id)
        self.gen_balancing_transactions()

    def ret_list(self):
        return self.list 

    def barGraphData(self):
        x = {}
        for i in self.list.filter(users__id__exact=self.uid):
            if str(i.tag) not in x:
                x[str(i.tag)] = 0
            x[str(i.tag)] += float(i.user_item_rel_set.get(user__id__exact=self.uid).payment_amount)

        ret_obj = []
        counter = 1
        for k,v in x.iteritems():
            ret_obj.append({'data': [ [counter, v ] ],'label': k })
            counter = counter + 1
        return json.dumps(ret_obj)
        
    def gen_balancing_transactions(self):
        users = User.objects.filter(house_id=self.house_id)
        balance_sum = {}
        for a in users:
            balance_sum[a.id] = 0
    
        # add in how much users owe
        for i in self.list:
            for e in i.user_item_rel_set.all():
                balance_sum[e.user.id] += e.payment_amount * -1

        # subtract out how much buyers paid
        for i in self.list:
            for e in i.buyer_item_rel_set.all():
                balance_sum[e.buyer.id] += e.payment_amount

        # transactions
        transactions = [] 
        for (k,v) in balance_sum.items():
            balance_sum[k] = float(v)

        self.ind_balance = balance_sum[self.uid]

        if self.ind_balance >= 0:
            self.sign = 'p'
        else:
            self.sign = 'n'
    
        # while array is non zero
        pdb.set_trace()
        while sum([balance_sum[p] for p in balance_sum]) > .01:
    
            # owes = [key, amount]
            owes = min(balance_sum.iteritems(), key=operator.itemgetter(1))
            expects = max(balance_sum.iteritems(), key=operator.itemgetter(1))
            
            if (owes[1] + expects[1]) < 0:
                amount = expects[1]
            else:
                amount = owes[1] * -1
   
            transactions.append([owes[0], expects[0], amount,
                                 User.objects.get(id=owes[0]).name,
                                 User.objects.get(id=expects[0]).name])
            balance_sum[expects[0]] -= amount
            balance_sum[owes[0]] += amount

        self.will_pay = [p for p in transactions if p[0] == self.uid]
        self.expects = [p for p in transactions if p[1] == self.uid]


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
