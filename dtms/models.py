from django.db import models
from django.utils import simplejson as json
import operator
import pdb
import datetime
from django.db.models import Q, Sum

class User(models.Model):
    name        = models.CharField(max_length=30)
    email       = models.EmailField(max_length=75)
    house_id    = models.PositiveIntegerField()
    house_name  = models.CharField(max_length=30)
    password    = models.CharField(max_length=50)

    def __unicode__(self):
        return self.name

class Item_list:

    def __init__(self, list = None, house_id = None, user_id = None,
                 archive_id = None, houseMode = 0):
        self.list = list
        self.house_id = house_id
        self.uid = int(user_id)
        self.archive_id = archive_id
        self.gen_balancing_transactions()
        self.houseMode = houseMode

    def ret_list(self):
        if self.houseMode=='1':
            return self.list .order_by('-id')
        else:
            # find anything that you bought or used and how much you paid for it
            u = User.objects.select_related().get(id=self.uid)
            items = self.list.filter((Q(user_item_rel__user__exact=u) |
                                      Q(buyer_item_rel__buyer__exact=u))).distinct().order_by('-id')

            #rel = User_item_rel.objects.select_related().filter(Q(item__in=self.list) & Q(user=u)).distinct()
            #ret_items = []

            #for t in rel:
            #    a = t.item
            #    a.ind_pay = t.payment_amount
            #    ret_items.append(a)


            #return ret_items

            #items = self.list.filter((~Q(user_item_rel__user__exact=u) &
            #                          Q(buyer_item_rel__buyer__exact=u))).distinct()
            #rel = Buyer_item_rel.objects.filter(Q(item__in=items) &
            #                                    Q(buyer=u)).distinct()
            #for t in rel:
            #    a = t.item
            #    a.price = -1 * t.payment_amount
            #    ret_items.append(a)

            #return ret_items

            for t in items:
                try: 
                    t.price = t.user_item_rel_set.get(user=u).payment_amount
                except:
                    t.price = -1 * t.buyer_item_rel_set.get(buyer=u).payment_amount
            return items


    def barGraphData(self, houseMode=0):
        x = {}
        if houseMode == 0:
            new_list = self.list.filter(users__id__exact=self.uid)
        else:
            new_list = self.list

        for i in new_list:
            if str(i.tag) not in x:
                x[str(i.tag)] = 0

            if houseMode == 0:
                x[str(i.tag)] += float(i.user_item_rel_set.get(user__id__exact=self.uid).payment_amount)
            else:
                x[str(i.tag)] += float(i.price)

        ret_obj = []
        counter = 1
        for k,v in x.iteritems():
            ret_obj.append({'data': [ [counter, v ] ],'label': k })
            counter = counter + 1
        return json.dumps(ret_obj)
        
    def gen_balancing_transactions(self):
        balances = {}
        self.will_pay = {}
        self.expects = {}
        self.sign = {}

        users = User.objects.filter(house_id=self.house_id)
        balance_sum = {}

        for a in users:
            b_p = Buyer_item_rel.objects.filter(Q(item__in=self.list) &
                                                Q(buyer=a))\
                    .distinct().aggregate(p=Sum('payment_amount'))
            u_p = User_item_rel.objects.filter(Q(item__in=self.list) &
                                               Q(user=a))\
                    .distinct().aggregate(p=Sum('payment_amount'))
            if b_p['p'] == None:
                b_p['p'] = 0
            if u_p['p'] == None:
                u_p['p'] = 0
            balance_sum[a.id] = b_p['p'] + u_p['p'] * -1
    

        # transactions
        transactions = [] 
        self.ind_balance = float(balance_sum[self.uid])

        balances = balance_sum.copy()

       # for v in balance_sum.iteritems():
       #     if v >= 0:
       #         self.sign[k] = 'p'
       #     else:
       #         self.sign[k] = 'n'

        if self.ind_balance >= 0:
            self.ind_sign = 'p'
        else:
            self.ind_sign = 'n'
    
        # while array is non zero
        while len([p for p in balance_sum if float(balance_sum[p]) > .01]) != 0:
    
            # owes = [key, amount]
            owes = min([(val, key) for (key, val) in balance_sum.items()])
            expects = max([(val, key) for (key, val) in balance_sum.items()])
            owes = list(owes)
            owes.reverse()
            expects = list(expects)
            expects.reverse()
            
            if (owes[1] + expects[1]) < 0:
                amount = expects[1]
            else:
                amount = owes[1] * -1
   
            transactions.append([owes[0], expects[0], amount,
                                 User.objects.get(id=owes[0]).name,
                                 User.objects.get(id=expects[0]).name])
            balance_sum[expects[0]] -= amount
            balance_sum[owes[0]] += amount

        self.ind_will_pay = [p for p in transactions if p[0] == self.uid]
        self.ind_expects = [p for p in transactions if p[1] == self.uid]
        
        self.names_and_balances = {}
        for u, v in zip(users, balances.items()):
            self.names_and_balances[u.name] = float(v[1])

        self.names_and_balances = self.names_and_balances.items()
        self.transactions = transactions

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
    
    class Meta:
        ordering = ['-purch_date']

    def shortDisplayBuyers(self):
        if len(self.buyer_item_rel_set.all()) != 1:
            return "multiple buyers"
        else:
            return self.buyer_item_rel_set.all()[0].buyer.name
    def listBuyers(self):
        return self.buyer_item_rel_set.all()
    
    def listUsers(self):
        return self.user_item_rel_set.all()

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
