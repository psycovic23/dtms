from dtms.models import *

class Item_list:

    def __init__(self, list = None, house_id = None):
        self.list = list
        self.house_id = house_id

    def ret_list(self):
        return self.list 

    def ind_breakdown(self, uid):
        u = User.objects.get(id=uid)
        x = {}
        for i in u.user_item_rel_set.all():
            if str(i.item.tag) not in x:
                x[str(i.item.tag)] = 0
            x[str(i.item.tag)] += float(i.payment_amount)
        ret_obj = []
        for k,v in x.iteritems():
            ret_obj.append({'label': k, 'data': v})
        return json.dumps(ret_obj)
        
    def gen_balancing_transactions(self):
        users = User.objects.filter(house_id=self.house_id)
        sum = {}
        for a in users:
            sum[a.id] = 0
    
        # add in how much users owe
        for i in self.list:
            for e in i.user_item_rel_set.all():
                sum[e.user.id] += e.payment_amount * -1

        # subtract out how much buyers paid
        for i in self.list:
            for e in i.buyer_item_rel_set.all():
                sum[e.buyer.id] += e.payment_amount

        # transactions
        transactions = [] 
        for (k,v) in sum.items():
            sum[k] = float(v)
    
        # while array is non zero
        while abs(max(sum.iteritems(), key=operator.itemgetter(1))[1]) > .01:
    
            owes = min(sum.iteritems(), key=operator.itemgetter(1))
            expects = max(sum.iteritems(), key=operator.itemgetter(1))
            
            if (owes[1] + expects[1]) < 0:
                amount = expects[1]
            else:
                amount = owes[1] * -1
   
            transactions.append([owes[0], expects[0], amount])
            sum[expects[0]] -= amount
            sum[owes[0]] += amount

        return transactions
