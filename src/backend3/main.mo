import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import List "mo:linked-list";
import Map "mo:stableheapbtreemap/BTree";

/// Backend server actor for the auction platform
actor Auction {
    /// Auction item. Shared type.
    type Item = {
        /// Auction title
        title : Text;
        /// Auction description
        description : Text;
        /// Image binary data, currently only PNG supported.
        image : Blob;
    };

    /// Auction bid. Shared type.
    type Bid = {
        /// Price in the unit of the currency (ICP).
        price : Nat;
        /// Point in time of the bid, measured as the
        /// remaining until the closing of the auction.
        time : Nat;
        /// Authenticated user id of this bid.
        originator : Principal.Principal;
    };

    /// Auction identifier that is generated and associated
    /// by the actor to later retrieve an auction.
    /// Shared type.
    type AuctionId = Nat;

    /// Detailed information of an auction.
    type Auction = {
        /// Item sold in the auction.
        item : Item;
        /// Series of valid bids in this auction, sorted by price.
        bidHistory : List.LinkedList<Bid>;
        /// Remaining time until the end of the auction.
        /// `0` means that the auction is closed.
        /// The last entry in `bidHistory`, if existing, denotes
        /// the auction winner.
        remainingTime : Nat;
    };

    /// Stable map of all auctions. Indexed by AuctionId.
    stable let auctions = Map.init<AuctionId, Auction>(null);

    /// Register a new auction that is open for the defined duration.
    func newAuction(auctionId : Nat, item : Item, duration : Nat) {
        let bidHistory = List.LinkedList<Bid>();
        let newAuction = {
            item;
            bidHistory;
            remainingTime = duration;
        };
        let result = Map.insert(auctions, Nat.compare, auctionId, newAuction);
        switch result {
            case null {};
            case _ Debug.trap("Duplicate auction id");
        };
    };

    /// Internal helper function for retrieving an auction by its id.
    /// Traps if the id is inexistent.
    func findAuction(auctionId : AuctionId) : Auction {
        switch (Map.get(auctions, Nat.compare, auctionId)) {
            case null Debug.trap("Inexistent auction");
            case (?auction) auction;
        };
    };

    /// Internal helper function to retrieve the minimum price for the next bid in an auction.
    /// The minimum price is one unit of the currency larger than the last bid.
    func minimumPrice(auction : Auction) : Nat {
        if (List.size(auction.bidHistory) == 0) {
            1;
        } else {
            List.get(auction.bidHistory, 0).price + 1;
        };
    };

    /// Make a new bid for a specific auction specified by the id.
    /// Checks that:
    /// * The price is valid, higher than the last bid, if existing.
    /// * The auction is still open (not finished).
    /// If valid, the bid is appended to the bid history.
    /// Otherwise, traps with an error.
    func makeBid(auctionId : AuctionId, price : Nat, originator : Principal) {
        let auction = findAuction(auctionId);
        if (price < minimumPrice(auction)) {
            Debug.trap("Price too low");
        };
        let time = auction.remainingTime;
        if (time == 0) {
            Debug.trap("Auction closed");
        };
        let newBid = { price; time; originator };
        List.append(auction.bidHistory, newBid);
    };

    public shared(message) func demoData(numberOfAuctions : Nat, bidsPerAuction: Nat): async() {
        let originator = message.caller;
        for (_ in Iter.range(1, numberOfAuctions)) {
            let auctionId = Map.size(auctions);
            newAuction(
                auctionId,
                {
                    title = "Auction" # debug_show (auctionId);
                    description = "";
                    image = "" : Blob;
                },
                1_000_000,
            );
            for (price in Iter.range(1, bidsPerAuction)) {
                makeBid(auctionId, price, originator);
            };
        };
    };
};
