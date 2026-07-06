/* ============================================================
   DevTrack — Main Application Logic (localStorage edition)
   ============================================================ */

// ============================================================
// STATE
// ============================================================
const State = {
  currentView: 'dashboard',
  currentProjectId: null,
  editingProjectId: null,
  editingTopicId: null,
  editingSubtopicId: null,
  editingSubtopicParentTopicId: null,
  selectedColor: '#6366f1',
  topicFilter: 'all',
  topicViewMode: 'list',
  panelTopicId: null,
  projects: [],
  topics: [],
  subtopics: [],
  activity: [],
  searchResults: null,
};

// ============================================================
// STORAGE KEYS
// ============================================================
const KEYS = {
  projects:  'devtrack_projects',
  topics:    'devtrack_topics',
  subtopics: 'devtrack_subtopics',
  activity:  'devtrack_activity',
};

// ============================================================
// SEED DATA — BitTorrent in Python (20 topics, 50+ subtopics)
// ============================================================
const BT_PROJECT_ID = 'bt-python-v1';

const BT_SEED = {
  project: {
    id: BT_PROJECT_ID,
    name: 'BitTorrent in Python',
    description: 'Build a fully functional BitTorrent client from scratch using Python — covering protocols, networking, file I/O, and peer-to-peer architecture.',
    language: 'Python',
    status: 'active',
    color: '#10b981',
    created_at: Date.now() - 86400000,
  },

  topics: [
    {
      id:'bt-t01', project_id:BT_PROJECT_ID, order_index:1,
      title:'BitTorrent Protocol Overview',
      description:'Understand what BitTorrent is, how peer-to-peer file sharing works, and the key components involved.',
      priority:'high', tag:'Foundation', completed:false,
      notes:'BitTorrent is a P2P protocol for distributing large files. Instead of downloading from one server, pieces come from many peers simultaneously. Key players: Tracker, Seeder, Leecher, Swarm.',
      links:'BEP-0003 — The BitTorrent Protocol | https://www.bittorrent.org/beps/bep_0003.html\nWikipedia — BitTorrent | https://en.wikipedia.org/wiki/BitTorrent\nHow BitTorrent Works (Visual) | https://www.howtogeek.com/115739/htg-explains-how-bittorrent-works/',
    },
    {
      id:'bt-t02', project_id:BT_PROJECT_ID, order_index:2,
      title:'Python Environment Setup',
      description:'Set up your dev environment with the right Python version and dependencies.',
      priority:'high', tag:'Setup', completed:false,
      notes:'Use Python 3.10+. Create a virtual env, install required libraries: bencode-py, aiohttp, tqdm, rich, click, hashlib (stdlib), struct (stdlib), asyncio (stdlib).',
      links:'Python venv docs | https://docs.python.org/3/library/venv.html\npip documentation | https://pip.pypa.io/en/stable/\nbencode-py on PyPI | https://pypi.org/project/bencode-py/',
    },
    {
      id:'bt-t03', project_id:BT_PROJECT_ID, order_index:3,
      title:'Networking Basics',
      description:'Core networking concepts needed before writing any BitTorrent code.',
      priority:'high', tag:'Foundation', completed:false,
      notes:'Start here before any BitTorrent code. Understand TCP vs UDP, sockets, IP addressing, and async I/O.',
      links:'Python socket HOWTO | https://docs.python.org/3/howto/sockets.html\nTCP vs UDP — Cloudflare | https://www.cloudflare.com/learning/ddos/glossary/tcp-vs-udp/\nasyncio docs | https://docs.python.org/3/library/asyncio.html',
    },
    {
      id:'bt-t04', project_id:BT_PROJECT_ID, order_index:4,
      title:'Torrent File Structure (.torrent)',
      description:'Parse .torrent metainfo files and extract all key fields.',
      priority:'high', tag:'Foundation', completed:false,
      notes:'A .torrent file is bencoded. It contains: announce URL, info dict (piece length, file list, pieces hash), info hash (SHA-1 of bencoded info dict).',
      links:'BEP-0003 — Metainfo file structure | https://www.bittorrent.org/beps/bep_0003.html#metainfo-file-structure\nWiki — Torrent file | https://en.wikipedia.org/wiki/Torrent_file\nParsing .torrent files in Python | https://markuseliasson.se/article/bittorrent-in-python/',
    },
    {
      id:'bt-t05', project_id:BT_PROJECT_ID, order_index:5,
      title:'Bencoding Decoder & Encoder',
      description:"Implement your own bencoder/decoder — BitTorrent's serialization format.",
      priority:'high', tag:'Core', completed:false,
      notes:'Bencoding: integers as i42e, strings as 4:spam, lists as l...e, dicts as d...e. Must handle nested structures. Write both encode() and decode().',
      links:'BEP-0003 — Bencoding | https://www.bittorrent.org/beps/bep_0003.html#bencoding\nWikipedia — Bencode | https://en.wikipedia.org/wiki/Bencode\nbencode-py source on GitHub | https://github.com/utdemir/bencoder',
    },
    {
      id:'bt-t06', project_id:BT_PROJECT_ID, order_index:6,
      title:'HTTP Tracker Protocol',
      description:'Communicate with HTTP trackers to get a list of peers.',
      priority:'high', tag:'Networking', completed:false,
      notes:'Send GET request with: info_hash, peer_id, port, uploaded, downloaded, left, event. Parse bencoded response to extract peer list (compact or dict format).',
      links:'BEP-0003 — Tracker HTTP Protocol | https://www.bittorrent.org/beps/bep_0003.html#trackers\nCompact Peers — BEP-0023 | https://www.bittorrent.org/beps/bep_0023.html\naiohttp docs | https://docs.aiohttp.org/en/stable/',
    },
    {
      id:'bt-t07', project_id:BT_PROJECT_ID, order_index:7,
      title:'UDP Tracker Protocol',
      description:'Implement the more efficient UDP tracker protocol.',
      priority:'medium', tag:'Networking', completed:false,
      notes:'1) Send connect request (magic 0x41727101980). 2) Receive connection_id. 3) Send announce with connection_id. 4) Parse compact peer list from response.',
      links:'BEP-0015 — UDP Tracker Protocol | https://www.bittorrent.org/beps/bep_0015.html\nPython struct docs | https://docs.python.org/3/library/struct.html\nUDP socket in Python | https://docs.python.org/3/library/socket.html#socket.SOCK_DGRAM',
    },
    {
      id:'bt-t08', project_id:BT_PROJECT_ID, order_index:8,
      title:'Peer Wire Protocol — Handshake',
      description:'Implement the 68-byte handshake to establish peer connections.',
      priority:'high', tag:'Protocol', completed:false,
      notes:'Handshake = 1 byte pstrlen (19) + "BitTorrent protocol" + 8 reserved bytes + 20-byte info_hash + 20-byte peer_id. Verify info_hash matches.',
      links:'BEP-0003 — Peer Wire Protocol | https://www.bittorrent.org/beps/bep_0003.html#peer-wire-protocol\nPeer Handshake explained | https://wiki.theory.org/BitTorrentSpecification#Handshake\nPython asyncio streams | https://docs.python.org/3/library/asyncio-stream.html',
    },
    {
      id:'bt-t09', project_id:BT_PROJECT_ID, order_index:9,
      title:'Peer Wire Protocol — Messages',
      description:'Implement all peer wire messages for data exchange.',
      priority:'high', tag:'Protocol', completed:false,
      notes:'All messages: 4-byte length prefix + 1-byte message ID. IDs: 0=choke, 1=unchoke, 2=interested, 3=not-interested, 4=have, 5=bitfield, 6=request, 7=piece, 8=cancel.',
      links:'Full Message Reference (wiki.theory.org) | https://wiki.theory.org/BitTorrentSpecification#Messages\nBEP-0003 — Messages | https://www.bittorrent.org/beps/bep_0003.html#peer-messages\nPython struct pack/unpack | https://docs.python.org/3/library/struct.html',
    },
    {
      id:'bt-t10', project_id:BT_PROJECT_ID, order_index:10,
      title:'Choking Algorithm',
      description:'Implement tit-for-tat choking to manage upload/download fairness.',
      priority:'medium', tag:'Protocol', completed:false,
      notes:'Tit-for-tat: unchoke the top 3-4 peers who upload the most to you every 10s. Optimistic unchoking: randomly unchoke 1 extra peer every 30s.',
      links:'BEP-0003 — Choking | https://www.bittorrent.org/beps/bep_0003.html#algorithms\nTit-for-tat in P2P (paper) | https://bittorrent.org/bittorrentecon.pdf\nOptimistic Unchoking | https://wiki.theory.org/BitTorrentSpecification#Choking_and_Optimistic_Unchoking',
    },
    {
      id:'bt-t11', project_id:BT_PROJECT_ID, order_index:11,
      title:'Piece Selection Strategy',
      description:'Implement rarest-first and end-game piece selection.',
      priority:'high', tag:'Core', completed:false,
      notes:'Rarest-first: download pieces that fewer peers have — improves swarm health. End-game: near completion, send the same request to multiple peers.',
      links:'Rarest First (BitTorrent paper) | https://bittorrent.org/bittorrentecon.pdf\nEnd-game mode wiki | https://wiki.theory.org/BitTorrentSpecification#end_game\nPiece selection strategies | https://en.wikipedia.org/wiki/BitTorrent#Piece_selection',
    },
    {
      id:'bt-t12', project_id:BT_PROJECT_ID, order_index:12,
      title:'Piece Verification & Storage',
      description:'Verify downloaded pieces with SHA-1 hashes and write to disk correctly.',
      priority:'high', tag:'Core', completed:false,
      notes:'Each piece has a SHA-1 hash in .torrent. After downloading, compute hashlib.sha1(piece_data).digest() and compare. Map piece offsets to actual file byte positions.',
      links:'Python hashlib docs | https://docs.python.org/3/library/hashlib.html\naiofiles (async disk I/O) | https://github.com/Tinche/aiofiles\nFile seek/write in Python | https://docs.python.org/3/tutorial/inputoutput.html',
    },
    {
      id:'bt-t13', project_id:BT_PROJECT_ID, order_index:13,
      title:'Asyncio Architecture',
      description:'Build the event loop architecture to handle hundreds of peer connections.',
      priority:'high', tag:'Architecture', completed:false,
      notes:'Use asyncio.open_connection for non-blocking TCP. One coroutine per peer. Use asyncio.Queue for piece requests. asyncio.gather() to run all peer coroutines concurrently.',
      links:'asyncio official docs | https://docs.python.org/3/library/asyncio.html\nasyncio — RealPython tutorial | https://realpython.com/async-io-python/\nasyncio streams | https://docs.python.org/3/library/asyncio-stream.html',
    },
    {
      id:'bt-t14', project_id:BT_PROJECT_ID, order_index:14,
      title:'Rate Limiting & Bandwidth Control',
      description:'Implement upload/download speed caps and request pipelining.',
      priority:'medium', tag:'Advanced', completed:false,
      notes:'Token bucket algorithm for rate limiting. Pipelining: send multiple block requests per peer without waiting for each response.',
      links:'Token Bucket Algorithm (Wikipedia) | https://en.wikipedia.org/wiki/Token_bucket\nRequest Pipelining in BitTorrent | https://wiki.theory.org/BitTorrentSpecification#Pipelining\nPython asyncio sleep | https://docs.python.org/3/library/asyncio-task.html#asyncio.sleep',
    },
    {
      id:'bt-t15', project_id:BT_PROJECT_ID, order_index:15,
      title:'DHT — Distributed Hash Table',
      description:'Implement Kademlia-based DHT for trackerless peer discovery.',
      priority:'medium', tag:'Advanced', completed:false,
      notes:'Kademlia: nodes identified by 160-bit ID. XOR distance metric. k-buckets routing table. Key ops: find_node, get_peers, announce_peer.',
      links:'BEP-0005 — DHT Protocol | https://www.bittorrent.org/beps/bep_0005.html\nKademlia Paper | https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf\nDHT explained simply | https://en.wikipedia.org/wiki/Kademlia',
    },
    {
      id:'bt-t16', project_id:BT_PROJECT_ID, order_index:16,
      title:'Peer Exchange (PEX)',
      description:'Implement BEP-10 extension protocol and PEX for peer sharing.',
      priority:'low', tag:'Advanced', completed:false,
      notes:'Extension protocol (BEP-10): negotiate extensions in handshake reserved bytes. PEX (ut_pex): peers share their known peer lists.',
      links:'BEP-0010 — Extension Protocol | https://www.bittorrent.org/beps/bep_0010.html\nBEP-0011 — Peer Exchange | https://www.bittorrent.org/beps/bep_0011.html\nExtension protocol example | https://wiki.theory.org/BitTorrentSpecification#Extension_Protocol',
    },
    {
      id:'bt-t17', project_id:BT_PROJECT_ID, order_index:17,
      title:'Magnet Links & Metadata Extension',
      description:'Support magnet URIs and fetch torrent metadata from peers (BEP-9).',
      priority:'medium', tag:'Feature', completed:false,
      notes:'Magnet format: magnet:?xt=urn:btih:<infohash>&dn=<name>&tr=<tracker>. BEP-9 (ut_metadata): fetch the info dict directly from peers.',
      links:'BEP-0009 — Metadata Extension | https://www.bittorrent.org/beps/bep_0009.html\nMagnet URI format | https://en.wikipedia.org/wiki/Magnet_URI_scheme\nPython urllib.parse | https://docs.python.org/3/library/urllib.parse.html',
    },
    {
      id:'bt-t18', project_id:BT_PROJECT_ID, order_index:18,
      title:'CLI Interface & Configuration',
      description:'Build a user-friendly command-line interface for the client.',
      priority:'medium', tag:'Feature', completed:false,
      notes:'Use argparse or Click. Accept: .torrent file or magnet link, --output dir, --max-upload-speed, --max-download-speed, --port.',
      links:'Click docs | https://click.palletsprojects.com/en/8.x/\nargparse docs | https://docs.python.org/3/library/argparse.html\nrich docs | https://rich.readthedocs.io/en/stable/',
    },
    {
      id:'bt-t19', project_id:BT_PROJECT_ID, order_index:19,
      title:'Progress Display & Logging',
      description:'Implement real-time progress display, speed stats, and ETA.',
      priority:'low', tag:'Feature', completed:false,
      notes:'Show: download speed (KB/s), upload speed, ETA, piece completion bar, number of connected peers. Use rich.progress or tqdm.',
      links:'rich progress docs | https://rich.readthedocs.io/en/stable/progress.html\ntqdm docs | https://tqdm.github.io/\nPython logging docs | https://docs.python.org/3/library/logging.html',
    },
    {
      id:'bt-t20', project_id:BT_PROJECT_ID, order_index:20,
      title:'Testing & Debugging',
      description:'Write unit tests, integration tests, and debug with Wireshark.',
      priority:'high', tag:'Testing', completed:false,
      notes:'Unit test: bencoder, piece verifier, message parser. Integration: download a small public-domain torrent. Use Wireshark to inspect peer wire traffic.',
      links:'pytest docs | https://docs.pytest.org/en/stable/\nWireshark download | https://www.wireshark.org/download.html\nasyncio testing guide | https://pytest-asyncio.readthedocs.io/en/latest/',
    },
  ],

  subtopics: [
    // T01 — Protocol Overview
    {id:'bt-s01',topic_id:'bt-t01',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'How P2P differs from client-server',
     description:'No central server; peers upload & download simultaneously.',
     notes:'In C/S: bandwidth bottleneck at server. In P2P: each downloader also uploads, scaling capacity with demand.',
     links:'P2P vs Client-Server (Wikipedia) | https://en.wikipedia.org/wiki/Peer-to-peer'},
    {id:'bt-s02',topic_id:'bt-t01',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Key terms: Swarm, Seeder, Leecher, Piece, Block',
     description:'Swarm = all peers for a torrent. Seeder = has 100%. Leecher = still downloading.',
     notes:'Piece = chunk of file (~256KB). Block = 16KB sub-piece. Swarm health = ratio of seeders to leechers.',
     links:'BitTorrent Glossary | https://wiki.theory.org/BitTorrentSpecification#Definitions'},
    {id:'bt-s03',topic_id:'bt-t01',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Role of the Tracker',
     description:'Tracker keeps a list of peers and hands them out on request.',
     notes:"Tracker doesn't transfer data — just coordinates peer discovery. Can be replaced by DHT.",
     links:'Tracker explained | https://www.bittorrent.org/beps/bep_0003.html#trackers\nOpenTracker | https://erdgeist.org/arts/software/opentracker/'},

    // T02 — Environment Setup
    {id:'bt-s04',topic_id:'bt-t02',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Create virtual environment',
     description:'python -m venv venv && source venv/bin/activate',
     notes:'On Windows: venv\\Scripts\\activate. Always use a venv to keep dependencies isolated.',
     links:'venv docs | https://docs.python.org/3/library/venv.html'},
    {id:'bt-s05',topic_id:'bt-t02',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Install dependencies',
     description:'pip install bencode-py aiohttp tqdm rich click',
     notes:'bencode-py for .torrent parsing. aiohttp for HTTP tracker. tqdm/rich for progress display.',
     links:'bencode-py | https://pypi.org/project/bencode-py/\naiohttp | https://pypi.org/project/aiohttp/\nrich | https://pypi.org/project/rich/'},
    {id:'bt-s06',topic_id:'bt-t02',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Project structure setup',
     description:'Organize into modules: client.py, tracker.py, peer.py, pieces.py, torrent.py',
     notes:'Good structure: /src with torrent.py, tracker.py, peer_manager.py, piece_manager.py, cli.py, dht.py.',
     links:'Python project layout guide | https://docs.python-guide.org/writing/structure/'},

    // T03 — Networking Basics
    {id:'bt-s07',topic_id:'bt-t03',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'TCP vs UDP — which protocols BitTorrent uses and why',
     description:'Peer connections use TCP. UDP tracker protocol uses UDP.',
     notes:'TCP: reliable, ordered — used for peer wire (data integrity). UDP: fast — used for tracker announces and DHT.',
     links:'TCP vs UDP explained | https://www.cloudflare.com/learning/ddos/glossary/tcp-vs-udp/\nRFC 793 — TCP | https://datatracker.ietf.org/doc/html/rfc793'},
    {id:'bt-s08',topic_id:'bt-t03',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Python socket module — binding, listening, accepting',
     description:'import socket; s = socket.socket(); s.bind((host, port)); s.listen()',
     notes:'For async code use asyncio.open_connection() instead of raw sockets.',
     links:'Python socket docs | https://docs.python.org/3/library/socket.html\nSocket HOWTO | https://docs.python.org/3/howto/sockets.html'},
    {id:'bt-s09',topic_id:'bt-t03',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Non-blocking I/O with asyncio',
     description:'Handle many peer connections concurrently in a single thread.',
     notes:'asyncio.open_connection(host, port) → (reader, writer). asyncio.gather(*coroutines) to run all peers concurrently.',
     links:'asyncio docs | https://docs.python.org/3/library/asyncio.html\nRealPython async IO | https://realpython.com/async-io-python/'},
    {id:'bt-s10',topic_id:'bt-t03',project_id:BT_PROJECT_ID,order_index:4,completed:false,
     title:'IP addressing & ports — how peers are identified',
     description:'(IP address, port) tuple uniquely identifies a peer on the network.',
     notes:'BitTorrent typically uses ports 6881-6889. Compact peer format: 4-byte IP + 2-byte port = 6 bytes per peer.',
     links:'Compact peers (BEP-23) | https://www.bittorrent.org/beps/bep_0023.html'},

    // T04 — Torrent File Structure
    {id:'bt-s11',topic_id:'bt-t04',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Bencoding format overview',
     description:"BitTorrent's serialization: ints, strings, lists, dicts.",
     notes:'i42e = integer 42. 4:spam = string "spam". l...e = list. d...e = dict.',
     links:'Bencode (Wikipedia) | https://en.wikipedia.org/wiki/Bencode\nBEP-0003 Bencoding | https://www.bittorrent.org/beps/bep_0003.html#bencoding'},
    {id:'bt-s12',topic_id:'bt-t04',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Parse .torrent files — extract announce, piece length, file list',
     description:'with open("file.torrent","rb") as f: data = bencode.decode(f.read())',
     notes:'Key fields: data[b"announce"], data[b"info"][b"name"], data[b"info"][b"piece length"], data[b"info"][b"pieces"].',
     links:'Metainfo file structure | https://www.bittorrent.org/beps/bep_0003.html#metainfo-file-structure\nMarkus Eliasson tutorial | https://markuseliasson.se/article/bittorrent-in-python/'},
    {id:'bt-s13',topic_id:'bt-t04',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Info hash — uniquely identifies a torrent',
     description:'SHA-1 hash of the bencoded info dictionary.',
     notes:'info_hash = hashlib.sha1(bencode.encode(data[b"info"])).digest() — 20 bytes.',
     links:'Python hashlib | https://docs.python.org/3/library/hashlib.html'},
    {id:'bt-s14',topic_id:'bt-t04',project_id:BT_PROJECT_ID,order_index:4,completed:false,
     title:'Piece hashes — verify downloaded data',
     description:'The "pieces" field contains concatenated 20-byte SHA-1 hashes.',
     notes:'pieces = data[b"info"][b"pieces"]. Split into 20-byte chunks. Compare with hashlib.sha1(downloaded_piece).digest().',
     links:'BEP-0003 — pieces field | https://www.bittorrent.org/beps/bep_0003.html'},

    // T05 — Bencoding
    {id:'bt-s15',topic_id:'bt-t05',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Bencoding decoder implementation',
     description:'Recursive decoder for integers, byte strings, lists, and dicts.',
     notes:'def decode(data, idx=0): check data[idx]. If b"i": read until b"e". If digit: read n:string.',
     links:'bencode-py source | https://github.com/utdemir/bencoder\nBencode Wikipedia | https://en.wikipedia.org/wiki/Bencode'},
    {id:'bt-s16',topic_id:'bt-t05',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Bencoding encoder implementation',
     description:'Encode Python objects back to bencode format.',
     notes:'int → b"i" + str(n).encode() + b"e". bytes → str(len).encode() + b":" + data.',
     links:'Bencode spec | https://www.bittorrent.org/beps/bep_0003.html#bencoding'},
    {id:'bt-s17',topic_id:'bt-t05',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Testing the bencoder',
     description:'Unit test encode/decode round-trip for all types.',
     notes:'assert decode(encode(42)) == 42. assert decode(encode(b"hello")) == b"hello". Test nested dicts too.',
     links:'pytest docs | https://docs.pytest.org/en/stable/getting-started.html'},

    // T06 — HTTP Tracker
    {id:'bt-s18',topic_id:'bt-t06',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Announce request parameters',
     description:'Send info_hash, peer_id, port, uploaded, downloaded, left, event.',
     notes:'params = {info_hash, peer_id, port: 6881, uploaded: 0, downloaded: 0, left: total_size, compact: 1, event: "started"}',
     links:'BEP-0003 Tracker | https://www.bittorrent.org/beps/bep_0003.html#trackers\naiohttp GET request | https://docs.aiohttp.org/en/stable/client_quickstart.html'},
    {id:'bt-s19',topic_id:'bt-t06',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Parse tracker response — extract peer list',
     description:'Decode bencoded response; peers field is compact (6 bytes/peer) or dict.',
     notes:'Compact: peers = response[b"peers"]. Split into 6-byte chunks: ip = socket.inet_ntoa(chunk[:4]).',
     links:'BEP-0023 — Compact Peers | https://www.bittorrent.org/beps/bep_0023.html\nsocket.inet_ntoa | https://docs.python.org/3/library/socket.html#socket.inet_ntoa'},
    {id:'bt-s20',topic_id:'bt-t06',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Tracker lifecycle events',
     description:'started, completed, stopped — signal lifecycle to tracker.',
     notes:'Send event=started on first announce. event=completed when download finishes. Re-announce every interval seconds.',
     links:'Tracker events | https://www.bittorrent.org/beps/bep_0003.html#trackers'},

    // T07 — UDP Tracker
    {id:'bt-s21',topic_id:'bt-t07',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Connection handshake — connect request/response',
     description:'Send magic number 0x41727101980, receive connection_id.',
     notes:'Connect request: action=0, transaction_id=random32, connection_id=0x41727101980. Use struct.pack/unpack.',
     links:'BEP-0015 — UDP Tracker | https://www.bittorrent.org/beps/bep_0015.html\nPython struct | https://docs.python.org/3/library/struct.html'},
    {id:'bt-s22',topic_id:'bt-t07',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Announce over UDP — binary packet format',
     description:'Use connection_id from handshake, parse compact peer response.',
     notes:'Announce: connection_id(8) + action=1(4) + transaction_id(4) + info_hash(20) + peer_id(20) + ... = 98 bytes total.',
     links:'BEP-0015 announce | https://www.bittorrent.org/beps/bep_0015.html#actions'},

    // T08 — Handshake
    {id:'bt-s23',topic_id:'bt-t08',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Build the 68-byte handshake message',
     description:'pstrlen + pstr + reserved + info_hash + peer_id',
     notes:'handshake = bytes([19]) + b"BitTorrent protocol" + b"\\x00"*8 + info_hash + peer_id.',
     links:'Handshake spec | https://wiki.theory.org/BitTorrentSpecification#Handshake\nBEP-0003 | https://www.bittorrent.org/beps/bep_0003.html'},
    {id:'bt-s24',topic_id:'bt-t08',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Verify peer handshake response',
     description:'Check info_hash matches; generate and verify peer_id.',
     notes:'Parse response: pstrlen=response[0] (must be 19). info_hash=response[28:48] (must match ours).',
     links:'Handshake parsing | https://wiki.theory.org/BitTorrentSpecification#Handshake'},
    {id:'bt-s25',topic_id:'bt-t08',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Peer ID generation',
     description:'Generate a unique 20-byte client identifier.',
     notes:'Convention: "-PY0001-" + 12 random chars. peer_id = b"-PY0001-" + os.urandom(12).',
     links:'Peer ID Conventions | https://wiki.theory.org/BitTorrentSpecification#peer_id\nos.urandom docs | https://docs.python.org/3/library/os.html#os.urandom'},

    // T09 — Peer Messages
    {id:'bt-s26',topic_id:'bt-t09',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Message framing — 4-byte length prefix',
     description:'Every message: 4-byte big-endian length + 1-byte ID + payload.',
     notes:'Parse: length = struct.unpack(">I", await reader.read(4))[0]. If length==0: keepalive.',
     links:'Message spec | https://wiki.theory.org/BitTorrentSpecification#Messages\nstruct docs | https://docs.python.org/3/library/struct.html'},
    {id:'bt-s27',topic_id:'bt-t09',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'choke / unchoke — flow control',
     description:'ID 0 = choke (stop sending). ID 1 = unchoke (may send).',
     notes:'Start state: choked and not interested. After receiving unchoke: can send request messages.',
     links:'Choke message | https://wiki.theory.org/BitTorrentSpecification#choke:_.3C.3E'},
    {id:'bt-s28',topic_id:'bt-t09',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'interested / not-interested — signal intent',
     description:'ID 2 = interested. ID 3 = not-interested.',
     notes:'Send interested when peer has pieces we need. Peer will then consider unchoking us.',
     links:'Interested message | https://wiki.theory.org/BitTorrentSpecification#interested:_.3C.3E'},
    {id:'bt-s29',topic_id:'bt-t09',project_id:BT_PROJECT_ID,order_index:4,completed:false,
     title:'bitfield / have — advertise available pieces',
     description:'bitfield sent right after handshake; have sent as pieces complete.',
     notes:'bitfield: each bit = whether we have that piece index. have: 4-byte piece index.',
     links:'bitfield message | https://wiki.theory.org/BitTorrentSpecification#bitfield:_.3Cbitfield.3E'},
    {id:'bt-s30',topic_id:'bt-t09',project_id:BT_PROJECT_ID,order_index:5,completed:false,
     title:'request / piece / cancel — block exchange',
     description:'request: ask for 16KB block. piece: receive data. cancel: abort request.',
     notes:'request: index(4) + begin(4) + length(4). Standard block size = 16384 bytes.',
     links:'Request message | https://wiki.theory.org/BitTorrentSpecification#request:_.3Cindex.3E_.3Cbegin.3E_.3Clength.3E'},

    // T10 — Choking
    {id:'bt-s31',topic_id:'bt-t10',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Tit-for-tat implementation',
     description:'Unchoke peers who upload the most to you every 10 seconds.',
     notes:'Every 10s: sort peers by bytes uploaded to us → unchoke top 3-4 → choke the rest.',
     links:'BitTorrent Economics Paper | https://bittorrent.org/bittorrentecon.pdf'},
    {id:'bt-s32',topic_id:'bt-t10',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Optimistic unchoking',
     description:'Randomly unchoke 1 extra peer every 30 seconds.',
     notes:'Every 30s: pick a random choked+interested peer → unchoke it. Gives new peers a chance.',
     links:'Choking algorithm | https://wiki.theory.org/BitTorrentSpecification#Choking_and_Optimistic_Unchoking'},

    // T11 — Piece Selection
    {id:'bt-s33',topic_id:'bt-t11',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Rarest-first algorithm',
     description:'Request pieces that the fewest peers have first.',
     notes:'For each piece, count how many connected peers have it. Sort ascending. Download rarest first.',
     links:'Rarest First (Wikipedia) | https://en.wikipedia.org/wiki/BitTorrent#Piece_selection\nBitTorrent Economics | https://bittorrent.org/bittorrentecon.pdf'},
    {id:'bt-s34',topic_id:'bt-t11',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'End-game mode',
     description:'Request final pieces from multiple peers simultaneously.',
     notes:'When <5 pieces remain: send request for each missing block to ALL peers. Cancel duplicate when first arrives.',
     links:'End-game spec | https://wiki.theory.org/BitTorrentSpecification#end_game'},
    {id:'bt-s35',topic_id:'bt-t11',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Sequential mode for streaming',
     description:'Download pieces in order for media streaming use cases.',
     notes:'Override rarest-first with sequential selection. Useful for streaming video while downloading.',
     links:'Piece selection overview | https://en.wikipedia.org/wiki/BitTorrent#Piece_selection'},

    // T12 — Piece Verification
    {id:'bt-s36',topic_id:'bt-t12',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'SHA-1 verification of received pieces',
     description:'Hash each completed piece; discard if mismatch.',
     notes:'expected_hash = piece_hashes[piece_index]. actual = hashlib.sha1(received_data).digest().',
     links:'hashlib docs | https://docs.python.org/3/library/hashlib.html'},
    {id:'bt-s37',topic_id:'bt-t12',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'File mapping — torrent byte offsets to disk files',
     description:'Map piece indices to byte ranges in actual files on disk.',
     notes:'For multi-file torrents: build offset table [(file_path, start_offset, length)].',
     links:'Multi-file spec | https://www.bittorrent.org/beps/bep_0003.html#info-dictionary'},
    {id:'bt-s38',topic_id:'bt-t12',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Disk I/O — sparse files and write buffering',
     description:'Efficiently write pieces to correct byte positions.',
     notes:'Use file.seek(offset) + file.write(data). Pre-allocate with truncate(total_size) for sparse file.',
     links:'aiofiles | https://github.com/Tinche/aiofiles\nPython file I/O | https://docs.python.org/3/tutorial/inputoutput.html'},

    // T13 — Asyncio
    {id:'bt-s39',topic_id:'bt-t13',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Event loop — single-threaded concurrency',
     description:'One thread handles hundreds of peer connections via coroutines.',
     notes:'asyncio.run(main()). Inside main(): asyncio.create_task(handle_peer(host, port)).',
     links:'asyncio event loop | https://docs.python.org/3/library/asyncio-eventloop.html\nRealPython asyncio | https://realpython.com/async-io-python/'},
    {id:'bt-s40',topic_id:'bt-t13',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'asyncio.open_connection — non-blocking TCP',
     description:'reader, writer = await asyncio.open_connection(host, port)',
     notes:'reader: StreamReader. writer: StreamWriter. Use reader.read(n) and writer.write(data) + await writer.drain().',
     links:'asyncio streams | https://docs.python.org/3/library/asyncio-stream.html'},
    {id:'bt-s41',topic_id:'bt-t13',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Queues & tasks — producer/consumer for piece requests',
     description:'asyncio.Queue to distribute piece work across peer coroutines.',
     notes:'piece_queue = asyncio.Queue(). Producer: put() piece indices. Consumer: get() piece, request it.',
     links:'asyncio.Queue | https://docs.python.org/3/library/asyncio-queue.html\nasyncio.gather | https://docs.python.org/3/library/asyncio-task.html#asyncio.gather'},

    // T14 — Rate Limiting
    {id:'bt-s42',topic_id:'bt-t14',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Token bucket for rate limiting',
     description:'Limit upload/download to configured max speed.',
     notes:'Token bucket: refill tokens at rate R/s. Each byte sent/received consumes 1 token.',
     links:'Token bucket (Wikipedia) | https://en.wikipedia.org/wiki/Token_bucket'},
    {id:'bt-s43',topic_id:'bt-t14',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Request pipelining',
     description:'Send multiple block requests per peer without waiting for each.',
     notes:'Instead of request→wait→request, send 5-10 requests before any responses arrive.',
     links:'Pipelining in BitTorrent | https://wiki.theory.org/BitTorrentSpecification#Pipelining'},

    // T15 — DHT
    {id:'bt-s44',topic_id:'bt-t15',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Kademlia basics — XOR distance metric',
     description:'Distributed key-value lookup over XOR distance between node IDs.',
     notes:'Node ID = 160-bit random value. Distance = XOR of two node IDs. Lookup converges in O(log N) steps.',
     links:'Kademlia paper | https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf\nKademlia Wikipedia | https://en.wikipedia.org/wiki/Kademlia'},
    {id:'bt-s45',topic_id:'bt-t15',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Routing table — k-buckets',
     description:'k-buckets store up to k=8 closest nodes at each XOR distance level.',
     notes:'160 k-buckets. Each bucket holds ≤8 nodes. LRU eviction. Enables efficient O(log N) routing.',
     links:'BEP-0005 DHT | https://www.bittorrent.org/beps/bep_0005.html'},
    {id:'bt-s46',topic_id:'bt-t15',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'get_peers / announce_peer — find peers for info_hash',
     description:'Lookup info_hash in DHT to find peers without a tracker.',
     notes:'get_peers: recursively ask closer nodes. announce_peer: tell closest nodes you have the file.',
     links:'DHT queries | https://www.bittorrent.org/beps/bep_0005.html#dht-queries'},
    {id:'bt-s47',topic_id:'bt-t15',project_id:BT_PROJECT_ID,order_index:4,completed:false,
     title:'Bootstrap nodes',
     description:'Initial contacts to join the DHT network.',
     notes:'router.bittorrent.com:6881, router.utorrent.com:6881, dht.transmissionbt.com:6881.',
     links:'BEP-0005 Bootstrap | https://www.bittorrent.org/beps/bep_0005.html'},

    // T16 — PEX
    {id:'bt-s48',topic_id:'bt-t16',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Extension protocol negotiation (BEP-10)',
     description:'Negotiate extensions via reserved bytes in the handshake.',
     notes:'Bit 20 of reserved bytes = extension protocol support. After handshake, exchange extension handshake (ID 20).',
     links:'BEP-0010 | https://www.bittorrent.org/beps/bep_0010.html'},
    {id:'bt-s49',topic_id:'bt-t16',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'PEX message format and handling',
     description:'Peers share their known peer lists via ut_pex messages.',
     notes:'PEX message: bencoded dict with "added" (compact peers), "added.f" (flags), "dropped".',
     links:'BEP-0011 PEX | https://www.bittorrent.org/beps/bep_0011.html'},

    // T17 — Magnet
    {id:'bt-s50',topic_id:'bt-t17',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Parse magnet URI',
     description:'Extract info_hash, name, and tracker URLs from magnet link.',
     notes:'from urllib.parse import urlparse, parse_qs. xt = params["xt"][0] → "urn:btih:<hex_hash>".',
     links:'Magnet URI scheme | https://en.wikipedia.org/wiki/Magnet_URI_scheme\nPython urllib.parse | https://docs.python.org/3/library/urllib.parse.html'},
    {id:'bt-s51',topic_id:'bt-t17',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'BEP-9 metadata extension (ut_metadata)',
     description:'Fetch torrent info dict from peers using ut_metadata messages.',
     notes:'request: {"msg_type":0, "piece":n}. data: {"msg_type":1,"piece":n,"total_size":s} + raw_data.',
     links:'BEP-0009 | https://www.bittorrent.org/beps/bep_0009.html'},

    // T18 — CLI
    {id:'bt-s52',topic_id:'bt-t18',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'argparse / Click CLI interface',
     description:'Accept .torrent or magnet, output dir, speed limits via CLI.',
     notes:'@click.command(). @click.argument("torrent"). @click.option("--output", default="./downloads").',
     links:'Click docs | https://click.palletsprojects.com/\nargparse docs | https://docs.python.org/3/library/argparse.html'},
    {id:'bt-s53',topic_id:'bt-t18',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Config file support',
     description:'Load default settings from ~/.devtrack/config.toml or config.json.',
     notes:'Use configparser or tomllib (Python 3.11+). Store: default_port, download_dir, max_peers.',
     links:'tomllib (Python 3.11+) | https://docs.python.org/3/library/tomllib.html\nconfigparser | https://docs.python.org/3/library/configparser.html'},

    // T19 — Progress Display
    {id:'bt-s54',topic_id:'bt-t19',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Real-time progress bar with rich or tqdm',
     description:'Show download speed, ETA, and piece completion in terminal.',
     notes:'rich.progress.Progress with SpinnerColumn, BarColumn, DownloadColumn, TimeRemainingColumn.',
     links:'rich progress | https://rich.readthedocs.io/en/stable/progress.html\ntqdm | https://tqdm.github.io/'},
    {id:'bt-s55',topic_id:'bt-t19',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Speed calculation and ETA',
     description:'Calculate rolling average download speed and estimated time.',
     notes:'Speed = bytes_downloaded_in_last_5s / 5. ETA = bytes_remaining / speed. Use deque(maxlen=5).',
     links:'Python collections.deque | https://docs.python.org/3/library/collections.html#collections.deque'},

    // T20 — Testing
    {id:'bt-s56',topic_id:'bt-t20',project_id:BT_PROJECT_ID,order_index:1,completed:false,
     title:'Unit tests — bencoder, piece verifier, message parser',
     description:'Test each module in isolation with pytest.',
     notes:'tests/test_bencode.py, test_pieces.py, test_messages.py. Use pytest fixtures. Aim for 80%+ coverage.',
     links:'pytest docs | https://docs.pytest.org/en/stable/\npytest-asyncio | https://pytest-asyncio.readthedocs.io/en/latest/'},
    {id:'bt-s57',topic_id:'bt-t20',project_id:BT_PROJECT_ID,order_index:2,completed:false,
     title:'Integration test — download public-domain torrent',
     description:'Download a small public-domain .torrent end-to-end.',
     notes:'Use a tiny public-domain torrent (e.g., Ubuntu ISO or Debian netinstall). Run with --max-peers 5.',
     links:'Ubuntu torrents | https://ubuntu.com/download/alternative-downloads\nDebian torrents | https://www.debian.org/distrib/netinst'},
    {id:'bt-s58',topic_id:'bt-t20',project_id:BT_PROJECT_ID,order_index:3,completed:false,
     title:'Wireshark analysis — inspect peer wire traffic',
     description:'Use Wireshark to capture and inspect BitTorrent peer connections.',
     notes:'Filter: tcp.port == 6881. Look for the 68-byte handshake, then message frames.',
     links:'Wireshark download | https://www.wireshark.org/download.html\nWireshark filters guide | https://wiki.wireshark.org/CaptureFilters'},
    {id:'bt-s59',topic_id:'bt-t20',project_id:BT_PROJECT_ID,order_index:4,completed:false,
     title:'Compare with reference client — qBittorrent',
     description:'Cross-check your client behavior against qBittorrent.',
     notes:'Run both on same torrent. Compare: peer connections, piece selection, choke/unchoke timing.',
     links:'qBittorrent | https://www.qbittorrent.org/\nqBittorrent source on GitHub | https://github.com/qbittorrent/qBittorrent'},
  ],
};

// ============================================================
// SEED DATA — VPN for Windows using Google Outline SDK & Wintun
// ============================================================
const VPN_PROJECT_ID = 'vpn-outline-windows-v1';

const VPN_SEED = {
  project: {
    id: VPN_PROJECT_ID,
    name: 'VPN for Windows (Outline SDK)',
    description: 'Build a Windows VPN client using the Google Outline SDK, Wintun virtual adapter, and a Go/Wails GUI — covering networking, systems programming, and tunnel integration from the ground up.',
    language: 'Go / C++ / Wails',
    status: 'active',
    color: '#06b6d4',
    created_at: Date.now() - 3600000,
  },

  topics: [
    // ── PHASE 1: FOUNDATION ───────────────────────────────────
    {
      id:'vpn-t01', project_id:VPN_PROJECT_ID, order_index:1,
      title:'Programming Logic & Python Basics',
      description:'Master core logic before touching Go or C++. Use Python to build a solid mental model of how programs think.',
      priority:'high', tag:'Phase 1 — Foundation', completed:false,
      notes:'Focus: variables, data types, operators, if/else, loops, functions, data structures (lists, dicts). Python is the most readable language to start with — the logic transfers 1:1 to Go.\n\nKey resources:\n• FreeCodeCamp — free, project-based\n• Codecademy Python course\n• CS50 from Harvard (edX) — gold standard for absolute beginners',
      links:'FreeCodeCamp | https://www.freecodecamp.org/\nCodecademy Python | https://www.codecademy.com/learn/learn-python-3\nCS50 on edX | https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science',
    },
    {
      id:'vpn-t02', project_id:VPN_PROJECT_ID, order_index:2,
      title:'Go (Golang) Language Fundamentals',
      description:'Learn Go — the heart of the Outline SDK. Go is simpler than C++ but very powerful for networking and systems work.',
      priority:'high', tag:'Phase 1 — Foundation', completed:false,
      notes:'Key topics:\n• Variables, types, control flow, functions\n• Pointers & structs\n• Interfaces (critical for Outline SDK)\n• Goroutines & channels (concurrency model)\n• Error handling (errors are values in Go)\n• Modules & packages (go.mod)\n\nStart with the official interactive Tour of Go — it runs in the browser, no install needed.',
      links:'A Tour of Go | https://tour.golang.org/\nGo official docs | https://go.dev/doc/\nGo by Example | https://gobyexample.com/\nEffective Go | https://go.dev/doc/effective_go',
    },
    {
      id:'vpn-t03', project_id:VPN_PROJECT_ID, order_index:3,
      title:'Development Environment Setup',
      description:'Set up all tools you need on Windows before writing a single line of VPN code.',
      priority:'high', tag:'Phase 1 — Foundation', completed:false,
      notes:'Install in this order:\n1. VS Code — https://code.visualstudio.com/\n2. Go compiler — https://go.dev/dl/ (latest stable)\n3. Git — https://git-scm.com/download/win\n4. Go extension for VS Code (ms-vscode.go)\n\nVerify: open PowerShell and run:\n  go version\n  git --version\n\nFirst program to write: "Hello, World!" in Go.',
      links:'Go Downloads | https://go.dev/dl/\nVS Code | https://code.visualstudio.com/\nGit for Windows | https://git-scm.com/download/win\nGo VS Code extension | https://marketplace.visualstudio.com/items?itemName=golang.go',
    },
    {
      id:'vpn-t04', project_id:VPN_PROJECT_ID, order_index:4,
      title:'C++ Basics for Windows Systems Programming',
      description:'Learn enough C++ to understand Windows APIs, drivers, and low-level system interaction needed for VPN components.',
      priority:'medium', tag:'Phase 1 — Foundation', completed:false,
      notes:'You do NOT need to be a C++ expert. Focus on:\n• Variables, pointers, references\n• Functions, classes, structs\n• Memory management (new/delete, stack vs heap)\n• Headers and compilation model\n• The Windows SDK types (HANDLE, DWORD, BOOL)\n\nLearnCpp.com is the best free resource — work through chapters 1–12.',
      links:'LearnCpp.com | https://www.learncpp.com/\nC++ Reference | https://en.cppreference.com/w/\nMicrosoft C++ Docs | https://docs.microsoft.com/en-us/cpp/cpp/',
    },

    // ── PHASE 2: NETWORKING ESSENTIALS ────────────────────────
    {
      id:'vpn-t05', project_id:VPN_PROJECT_ID, order_index:5,
      title:'How the Internet Works — Core Concepts',
      description:'You cannot build a VPN if you don\'t understand how data travels. Master these before writing any VPN code.',
      priority:'high', tag:'Phase 2 — Networking', completed:false,
      notes:'Critical concepts to understand:\n• IP Addresses (IPv4 vs IPv6)\n• Subnets & CIDR notation (e.g., 192.168.1.0/24)\n• Ports — how multiple programs share one internet connection\n• TCP vs UDP — reliability vs speed tradeoff\n• The Client-Server model\n• DNS — how domain names become IP addresses\n• HTTP/HTTPS — the web\'s request-response protocol\n\nPractice on Windows CMD:\n  ping google.com\n  tracert google.com\n  netstat -an',
      links:'Cloudflare: How the Internet Works | https://www.cloudflare.com/learning/network-layer/how-does-the-internet-work/\nTCP vs UDP (Cloudflare) | https://www.cloudflare.com/learning/ddos/glossary/tcp-vs-udp/\nHow DNS Works | https://www.cloudflare.com/learning/dns/what-is-dns/',
    },
    {
      id:'vpn-t06', project_id:VPN_PROJECT_ID, order_index:6,
      title:'The OSI Model — Network Layers',
      description:'Understand the 7-layer OSI model. A VPN operates primarily at layers 3 (Network/IP) and 4 (Transport/TCP-UDP).',
      priority:'high', tag:'Phase 2 — Networking', completed:false,
      notes:'The 7 OSI Layers (remember: "All People Seem To Need Data Processing"):\n1. Physical — cables, WiFi signals\n2. Data Link — MAC addresses, Ethernet frames\n3. Network — IP addresses, routing (THIS IS VPN TERRITORY)\n4. Transport — TCP/UDP ports (THIS IS VPN TERRITORY)\n5. Session — managing connections\n6. Presentation — encryption, encoding\n7. Application — HTTP, DNS, your apps\n\nA VPN "wraps" your layer 3 & 4 packets inside an encrypted tunnel.',
      links:'OSI Model Explained (Cloudflare) | https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/\nOSI vs TCP/IP Model | https://www.imperva.com/learn/application-security/osi-model/\nWikipedia OSI Model | https://en.wikipedia.org/wiki/OSI_model',
    },
    {
      id:'vpn-t07', project_id:VPN_PROJECT_ID, order_index:7,
      title:'Socket Programming in Go',
      description:'Learn how to open sockets in Go to send and receive data — the fundamental skill for any networking application.',
      priority:'high', tag:'Phase 2 — Networking', completed:false,
      notes:'Key Go packages: net, net/http\n\nPractice exercises (in order):\n1. Write a TCP server that echoes back whatever it receives\n2. Write a TCP client that connects to that server\n3. Build a "chat" app — two terminal windows sending messages\n4. Make an HTTP GET request to fetch a web page\n\nThis is the most important hands-on step before touching the Outline SDK.',
      links:'Go net package docs | https://pkg.go.dev/net\nGo by Example: TCP Server | https://gobyexample.com/tcp-server\nGo by Example: HTTP Client | https://gobyexample.com/http-clients\nGo net/http docs | https://pkg.go.dev/net/http',
    },
    {
      id:'vpn-t08', project_id:VPN_PROJECT_ID, order_index:8,
      title:'Shadowsocks Protocol — Outline\'s Encryption',
      description:'Understand Shadowsocks — the core encryption protocol used by the Outline SDK to disguise VPN traffic.',
      priority:'medium', tag:'Phase 2 — Networking', completed:false,
      notes:'Shadowsocks is a SOCKS5 proxy protocol with encryption. It works by:\n1. Client connects to a local SOCKS5 proxy\n2. Proxy encrypts traffic using a shared secret key\n3. Encrypted data is sent to a Shadowsocks server\n4. Server decrypts and forwards to the actual destination\n\nThe Outline SDK handles this automatically — you just need to understand WHAT it does.\n\nEncryption used: AEAD ciphers (AES-256-GCM, ChaCha20-Poly1305)',
      links:'Shadowsocks Wikipedia | https://en.wikipedia.org/wiki/Shadowsocks\nShadowsocks Official | https://shadowsocks.org/\nAEAD Ciphers (Wikipedia) | https://en.wikipedia.org/wiki/Authenticated_encryption\nOutline SDK — Transport Docs | https://github.com/Jigsaw-Code/outline-sdk',
    },
    {
      id:'vpn-t09', project_id:VPN_PROJECT_ID, order_index:9,
      title:'Wireshark — See Your Network Traffic',
      description:'Install and use Wireshark to visually inspect what data is flowing on your network. Essential for debugging your VPN.',
      priority:'medium', tag:'Phase 2 — Networking', completed:false,
      notes:'Wireshark is a "network sniffer" — it captures and displays every packet on your network adapter.\n\nPractice:\n1. Open Wireshark, select your WiFi adapter\n2. Filter: tcp.port == 80 → see unencrypted HTTP traffic\n3. Run your Go TCP server from the socket exercise, then filter by port\n4. Later: verify your VPN traffic is encrypted (you should see garbage, not readable data)\n\nThis tool will be invaluable for debugging your VPN tunnel.',
      links:'Wireshark Download | https://www.wireshark.org/download.html\nWireshark User Guide | https://www.wireshark.org/docs/wsug_html_chunked/\nWireshark Display Filters | https://wiki.wireshark.org/DisplayFilters',
    },

    // ── PHASE 3: WINDOWS SYSTEMS PROGRAMMING ─────────────────
    {
      id:'vpn-t10', project_id:VPN_PROJECT_ID, order_index:10,
      title:'Windows API & Go syscall Package',
      description:'Learn how to interact with the Windows Operating System from Go code — processes, handles, and system calls.',
      priority:'high', tag:'Phase 3 — Windows Systems', completed:false,
      notes:'Key concepts:\n• HANDLE — Windows\'s universal resource identifier\n• Windows API functions (CreateProcess, OpenProcess, etc.)\n• Go\'s golang.org/x/sys/windows package for Windows APIs\n• Registry access\n• Service management\n\nStart with small programs:\n• Get a list of all running processes in Go\n• Read a Windows Registry key using Go\n• Open a file using a Windows HANDLE instead of os.Open',
      links:'Go Windows syscall | https://pkg.go.dev/golang.org/x/sys/windows\nWindows API Index (Microsoft) | https://docs.microsoft.com/en-us/windows/win32/apiindex/windows-api-list\nGo OS package | https://pkg.go.dev/os',
    },
    {
      id:'vpn-t11', project_id:VPN_PROJECT_ID, order_index:11,
      title:'Wintun — The Virtual Network Adapter Driver',
      description:'Understand and use Wintun — the high-performance Windows driver that creates virtual network interfaces for VPN tunnels.',
      priority:'high', tag:'Phase 3 — Windows Systems', completed:false,
      notes:'Wintun is an open-source Windows kernel driver that creates a "virtual network card." When you send packets into Wintun, they come out as a real network interface — your OS thinks it\'s talking to a real network card.\n\nThis is how ALL modern Windows VPNs work (WireGuard, OpenVPN, etc.)\n\nKey concepts:\n• Wintun creates a TUN (network layer) device\n• Your VPN app reads raw IP packets from the device\n• It encrypts them and sends via real internet connection\n• Incoming encrypted data is decrypted and written back to Wintun\n• Windows then routes traffic through Wintun\n\nInstall: Download wintun.dll from wintun.net and place next to your .exe',
      links:'Wintun Official Site | https://wintun.net/\nWintun GitHub | https://github.com/WireGuard/wintun\nWintun Go Bindings | https://pkg.go.dev/golang.zx2c4.com/wintun\nWireGuard (uses Wintun) | https://www.wireguard.com/',
    },
    {
      id:'vpn-t12', project_id:VPN_PROJECT_ID, order_index:12,
      title:'Windows Routing Tables',
      description:'Learn how Windows decides where to send network traffic — and how to manipulate this to route traffic through your VPN tunnel.',
      priority:'high', tag:'Phase 3 — Windows Systems', completed:false,
      notes:'A routing table is Windows\'s "map" for where to send network packets.\n\nKey commands to learn:\n  route print         → see the current routing table\n  route add [dest] mask [mask] [gateway] → add a route\n  route delete [dest]  → remove a route\n\nFor a VPN, you need to:\n1. Add a route: "all internet traffic (0.0.0.0/0) → go through Wintun adapter"\n2. Exception: "traffic to the VPN server → go through real network card"\n3. On disconnect: restore original routes\n\nIn Go: use golang.org/x/net/route or call route.exe via exec.Command',
      links:'Windows route command docs | https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008\nGo exec.Command | https://pkg.go.dev/os/exec\nNetRoute Go package | https://pkg.go.dev/golang.org/x/net/route',
    },
    {
      id:'vpn-t13', project_id:VPN_PROJECT_ID, order_index:13,
      title:'Windows Privileges & UAC (Administrator Rights)',
      description:'VPNs must run as Administrator to modify network adapters and routing tables. Learn how to request these rights correctly.',
      priority:'high', tag:'Phase 3 — Windows Systems', completed:false,
      notes:'Windows UAC (User Account Control) requires elevated privileges to:\n• Create network adapters (Wintun)\n• Modify routing tables\n• Install or interact with kernel drivers\n\nFor a Go app, you need an "application manifest" file that requests elevation:\n• Create a .manifest file requesting requireAdministrator\n• Embed it into your .exe using the rsrc tool or go:embed\n\nAlternatively, check at runtime with:\n  windows.GetCurrentToken().IsElevated()\n  If not elevated, re-launch self with ShellExecute("runas", ...)',
      links:'Windows App Manifests | https://docs.microsoft.com/en-us/windows/win32/sbscs/application-manifests\nrsrc tool for Go | https://github.com/akavel/rsrc\nGo Windows Token | https://pkg.go.dev/golang.org/x/sys/windows#Token.IsElevated\nUAC explained | https://docs.microsoft.com/en-us/windows/security/identity-protection/user-account-control/how-user-account-control-works',
    },
    {
      id:'vpn-t14', project_id:VPN_PROJECT_ID, order_index:14,
      title:'DNS Leak Prevention',
      description:'A VPN that leaks DNS queries is insecure. Learn what DNS leaks are and how to prevent them on Windows.',
      priority:'medium', tag:'Phase 3 — Windows Systems', completed:false,
      notes:'A DNS leak happens when your DNS queries (domain name lookups) bypass the VPN tunnel and go directly through your ISP — revealing what websites you visit.\n\nPrevention methods:\n1. Configure the Wintun adapter\'s DNS servers to point to a secure DNS (e.g., 1.1.1.1)\n2. Override Windows DNS settings via SetAdapterDNS (Win32 API)\n3. Route UDP port 53 traffic through the VPN tunnel\n\nTest for leaks: visit dnsleaktest.com while connected\n\nThe Outline SDK handles some of this — study its TransportDialer interface.',
      links:'DNS Leak Test | https://www.dnsleaktest.com/\nWindows DNS Configuration (Microsoft) | https://docs.microsoft.com/en-us/windows-server/networking/dns/\nOutline SDK Transport Docs | https://github.com/Jigsaw-Code/outline-sdk\nCloudflare 1.1.1.1 | https://1.1.1.1/',
    },

    // ── PHASE 4: INTEGRATION ──────────────────────────────────
    {
      id:'vpn-t15', project_id:VPN_PROJECT_ID, order_index:15,
      title:'Google Outline SDK — Study & Setup',
      description:'Clone the Outline SDK, understand its architecture, and run the existing example tools before modifying anything.',
      priority:'high', tag:'Phase 4 — Integration', completed:false,
      notes:'GOLDEN RULE: Don\'t try to change anything yet. Just get it running.\n\nSteps:\n1. Clone: git clone https://github.com/Jigsaw-Code/outline-sdk\n2. Read the README carefully\n3. Navigate to x/examples/ and find outline-cli\n4. Build: go build ./x/examples/outline-cli\n5. Run it with a test Shadowsocks access key\n6. Verify traffic flows through the proxy (check with Wireshark)\n\nKey SDK interfaces to understand:\n• transport.StreamDialer — creates encrypted connections\n• transport.PacketListener — for UDP\n• network.IPDevice — represents the Wintun tunnel\n• network.TCPHandler, network.UDPHandler — route traffic',
      links:'Outline SDK GitHub | https://github.com/Jigsaw-Code/outline-sdk\nOutline SDK Go Docs | https://pkg.go.dev/github.com/Jigsaw-Code/outline-sdk\nOutline CLI Example | https://github.com/Jigsaw-Code/outline-sdk/tree/main/x/examples\nJigsaw (makers of Outline) | https://jigsaw.google.com/',
    },
    {
      id:'vpn-t16', project_id:VPN_PROJECT_ID, order_index:16,
      title:'Integrating Outline SDK + Wintun',
      description:'Connect the Outline SDK\'s transport layer with the Wintun virtual adapter to create a real working VPN tunnel.',
      priority:'high', tag:'Phase 4 — Integration', completed:false,
      notes:'This is the core integration step — the heart of the VPN.\n\nArchitecture:\n  [Windows apps] → [Wintun TUN device] → [Your Go app] → [Outline SDK (Shadowsocks)] → [Internet]\n\nPacket flow:\n1. Windows routes all traffic to Wintun adapter\n2. Your Go app reads raw IP packets from Wintun\n3. Extract TCP/UDP sessions from raw packets (using a "TUN-to-SOCKS" layer)\n4. Pass to Outline SDK\'s StreamDialer / PacketListener\n5. SDK encrypts and sends to Outline server\n6. Response comes back encrypted → SDK decrypts → write to Wintun\n\nKey library: github.com/Jigsaw-Code/outline-sdk/x/connectivity provides connectivity testing.\nLook at the outline-sdk/x/tun2socks for the TUN-to-SOCKS bridge implementation.',
      links:'Outline SDK x/tun2socks | https://github.com/Jigsaw-Code/outline-sdk/tree/main/x\nWintun Go Bindings | https://pkg.go.dev/golang.zx2c4.com/wintun\nTUN2SOCKS concept | https://github.com/xjasonlyu/tun2socks\nOutline SDK Network Package | https://pkg.go.dev/github.com/Jigsaw-Code/outline-sdk/network',
    },
    {
      id:'vpn-t17', project_id:VPN_PROJECT_ID, order_index:17,
      title:'Building the GUI with Wails',
      description:'Wrap your VPN Go backend in a native-looking Windows GUI using Wails — HTML/JS frontend with Go backend.',
      priority:'medium', tag:'Phase 4 — Integration', completed:false,
      notes:'Wails lets you build desktop apps with Go on the backend and HTML/CSS/JS on the frontend (similar to Electron but uses WebView2, not Chromium — much lighter).\n\nSetup:\n  go install github.com/wailsapp/wails/v2/cmd/wails@latest\n  wails init -n vpn-client -t vanilla\n  wails dev   → hot-reload dev mode\n  wails build → production build\n\nMin UI you need:\n• A text input to paste the Outline access key\n• A "Connect / Disconnect" toggle button\n• A status indicator (green = connected, red = disconnected)\n• Connection logs\n\nGo functions are exposed to JS via app.Bind()',
      links:'Wails Official Site | https://wails.io/\nWails Documentation | https://wails.io/docs/introduction\nWails GitHub | https://github.com/wailsapp/wails\nWails Getting Started | https://wails.io/docs/gettingstarted/installation',
    },
    {
      id:'vpn-t18', project_id:VPN_PROJECT_ID, order_index:18,
      title:'Outline Access Key Parsing',
      description:'Parse the Outline access key format (ss:// URI) to extract server, port, password, and cipher information.',
      priority:'high', tag:'Phase 4 — Integration', completed:false,
      notes:'An Outline access key looks like:\nss://BASE64_ENCODED_CREDENTIALS@server:port\n\nDecoded, it contains: cipher:password@server:port\n\nExample: ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpzZWNyZXRAexample.com:12345\n\nParsing in Go:\n1. Parse as a URL: url.Parse(accessKey)\n2. Base64-decode the userinfo portion\n3. Split decoded string on ":" to get cipher and password\n4. Extract host and port from the URL\n\nThe Outline SDK has built-in key parsing — check transport/shadowsocks/client_test.go for examples.',
      links:'Outline Key Format (GitHub) | https://github.com/Jigsaw-Code/outline-sdk/blob/main/transport/shadowsocks/client.go\nGo url.Parse docs | https://pkg.go.dev/net/url#Parse\nBase64 in Go | https://pkg.go.dev/encoding/base64\nShadowsocks URI scheme | https://shadowsocks.org/doc/sip002.html',
    },
    {
      id:'vpn-t19', project_id:VPN_PROJECT_ID, order_index:19,
      title:'Connection Lifecycle Management',
      description:'Implement clean connect/disconnect logic — start the VPN tunnel and tear it all down cleanly on disconnect.',
      priority:'high', tag:'Phase 4 — Integration', completed:false,
      notes:'Connect sequence:\n1. Parse access key → get server details\n2. Request admin elevation (if not already elevated)\n3. Create Wintun adapter\n4. Set up routing (default route → Wintun)\n5. Set up DNS on Wintun adapter\n6. Initialize Outline SDK dialer\n7. Start TUN-to-SOCKS bridge\n8. Update UI status → "Connected"\n\nDisconnect sequence (reverse order):\n1. Stop TUN-to-SOCKS bridge goroutines (context.Cancel())\n2. Restore original routing table\n3. Restore original DNS settings\n4. Delete Wintun adapter\n5. Update UI status → "Disconnected"\n\nIf the app crashes (or is killed), routing must be restored — use defer + os/signal handling.',
      links:'Go context package | https://pkg.go.dev/context\nGo os/signal | https://pkg.go.dev/os/signal\nGo defer keyword | https://go.dev/tour/flowcontrol/12\nWintun adapter management | https://pkg.go.dev/golang.zx2c4.com/wintun',
    },
    {
      id:'vpn-t20', project_id:VPN_PROJECT_ID, order_index:20,
      title:'Testing, Debugging & Packaging',
      description:'Test your VPN thoroughly, debug with Wireshark, and package a distributable Windows .exe.',
      priority:'medium', tag:'Phase 4 — Integration', completed:false,
      notes:'Testing checklist:\n☐ Connectivity test: can you load a website after connecting?\n☐ IP leak test: visit whatismyip.com — it should show the VPN server IP, not yours\n☐ DNS leak test: visit dnsleaktest.com — no local ISP DNS should appear\n☐ Disconnect test: verify routes are restored and normal browsing resumes\n☐ Crash test: kill the process mid-connection — routes must be restored (signal handling)\n\nDebugging tools:\n• Wireshark: verify encrypted traffic on the real adapter\n• route print: verify routing table changes\n• ipconfig /all: verify DNS settings\n\nPackaging:\n• wails build → generates .exe + wintun.dll\n• Create an installer with Inno Setup or NSIS\n• Sign with a code signing certificate (optional but recommended)',
      links:'Wireshark | https://www.wireshark.org/\nWhatIsMyIP | https://www.whatismyip.com/\nDNS Leak Test | https://www.dnsleaktest.com/\nInno Setup (Windows Installer) | https://jrsoftware.org/isinfo.php\nWails Build Docs | https://wails.io/docs/reference/cli#build',
    },
  ],

  subtopics: [
    // T01 — Python Basics
    {id:'vpn-s01',topic_id:'vpn-t01',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'Variables, data types, and operators',
     description:'The absolute basics: storing data and performing operations.',
     notes:'Python: x = 5 (int), name = "Go" (str), flag = True (bool). Operations: +, -, *, /, // (integer div), % (modulo), ** (power).',
     links:'Python basics | https://www.w3schools.com/python/python_variables.asp'},
    {id:'vpn-s02',topic_id:'vpn-t01',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'Control flow: if/else and loops',
     description:'Make your program "think" and repeat actions.',
     notes:'if condition: / elif: / else:. Loops: for item in list: / while condition:. break and continue.',
     links:'Python control flow | https://docs.python.org/3/tutorial/controlflow.html'},
    {id:'vpn-s03',topic_id:'vpn-t01',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'Functions and modular code',
     description:'Break big programs into small, reusable pieces.',
     notes:'def my_func(param1, param2): / return value. Default args, *args, **kwargs. This concept maps directly to Go functions.',
     links:'Python functions | https://docs.python.org/3/tutorial/controlflow.html#defining-functions'},
    {id:'vpn-s04',topic_id:'vpn-t01',project_id:VPN_PROJECT_ID,order_index:4,completed:false,
     title:'Data structures: lists, dicts, tuples',
     description:'Store and organize collections of data.',
     notes:'list = [1, 2, 3] (mutable). dict = {"key": "value"} (key-value). tuple = (1, 2) (immutable). These map to Go slices and maps.',
     links:'Python data structures | https://docs.python.org/3/tutorial/datastructures.html'},

    // T02 — Go Language
    {id:'vpn-s05',topic_id:'vpn-t02',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'Go variables, types, and control flow',
     description:'The syntax is different from Python but the logic is the same.',
     notes:'var x int = 5 or x := 5 (short declaration). Types: int, string, bool, float64, []byte. if/for/switch. Go has NO while — use for instead.',
     links:'Tour of Go: Basics | https://tour.golang.org/basics/1'},
    {id:'vpn-s06',topic_id:'vpn-t02',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'Structs and interfaces in Go',
     description:'Interfaces are the KEY to understanding how the Outline SDK is structured.',
     notes:'type Server struct { Host string; Port int }. Interface: type Dialer interface { Dial(ctx, addr) (net.Conn, error) }. The Outline SDK is built entirely around interfaces.',
     links:'Tour of Go: Structs | https://tour.golang.org/moretypes/2\nTour of Go: Interfaces | https://tour.golang.org/methods/9'},
    {id:'vpn-s07',topic_id:'vpn-t02',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'Goroutines and channels — Go\'s concurrency',
     description:'Go makes concurrent code easy. Your VPN will use goroutines heavily.',
     notes:'go func() — run in background. chan — communicate between goroutines. context.Context — cancel goroutines cleanly. sync.WaitGroup — wait for goroutines to finish.',
     links:'Tour of Go: Goroutines | https://tour.golang.org/concurrency/1\nGo Concurrency Patterns | https://go.dev/blog/pipelines'},
    {id:'vpn-s08',topic_id:'vpn-t02',project_id:VPN_PROJECT_ID,order_index:4,completed:false,
     title:'Error handling in Go',
     description:'Go doesn\'t throw exceptions — errors are return values.',
     notes:'if err != nil { return err } is the most common Go pattern. fmt.Errorf("context: %w", err) wraps errors. errors.Is() and errors.As() for checking error types.',
     links:'Go error handling blog | https://go.dev/blog/error-handling-and-go\nTour of Go: Errors | https://tour.golang.org/methods/19'},

    // T03 — Dev Setup
    {id:'vpn-s09',topic_id:'vpn-t03',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'Install Go and write Hello World',
     description:'Get Go running and verify with your first program.',
     notes:'1. Download from go.dev/dl. 2. Run installer. 3. Open VS Code. 4. Create main.go: package main; import "fmt"; func main() { fmt.Println("Hello!") }. 5. go run main.go',
     links:'Go Installation | https://go.dev/doc/install'},
    {id:'vpn-s10',topic_id:'vpn-t03',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'Git basics — clone, commit, push',
     description:'You\'ll need Git to download the Outline SDK and manage your code.',
     notes:'Essential commands: git clone [url], git status, git add ., git commit -m "message", git push. Also: git log, git diff, git checkout -b new-branch.',
     links:'Git Handbook (GitHub) | https://guides.github.com/introduction/git-handbook/\nPro Git Book (free) | https://git-scm.com/book/en/v2'},
    {id:'vpn-s11',topic_id:'vpn-t03',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'Go modules and dependency management',
     description:'How Go manages external packages (like the Outline SDK).',
     notes:'go mod init my-vpn creates go.mod. go get github.com/Jigsaw-Code/outline-sdk adds a dependency. go mod tidy cleans up unused deps. go.sum is the checksum file — commit it.',
     links:'Go modules guide | https://go.dev/doc/modules/gomod-ref\nGo modules tutorial | https://go.dev/blog/using-go-modules'},

    // T05 — Internet Concepts
    {id:'vpn-s12',topic_id:'vpn-t05',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'IP addresses and subnets',
     description:'Every device on the internet has an IP address. Understand how they work.',
     notes:'IPv4: 4 octets, e.g. 192.168.1.100. 0.0.0.0/0 = "all addresses". Private ranges: 10.x.x.x, 192.168.x.x, 172.16-31.x.x. Your VPN server will have a public IP.',
     links:'IP addressing explained | https://www.cloudflare.com/learning/network-layer/what-is-an-ip-address/'},
    {id:'vpn-s13',topic_id:'vpn-t05',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'TCP vs UDP — when to use each',
     description:'TCP = reliable delivery. UDP = fast but unreliable. Your VPN uses both.',
     notes:'TCP: guaranteed delivery, in-order, slower. Used for HTTP, SSH. UDP: fire-and-forget, faster. Used for DNS, video calls. Shadowsocks primarily tunnels TCP; DNS uses UDP.',
     links:'TCP vs UDP | https://www.cloudflare.com/learning/ddos/glossary/tcp-vs-udp/'},
    {id:'vpn-s14',topic_id:'vpn-t05',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'Practice: ping, tracert, netstat on Windows',
     description:'Use built-in Windows tools to see how your computer communicates.',
     notes:'CMD commands: ping 8.8.8.8 (test connectivity). tracert google.com (see route to server). netstat -an (list all active connections). nslookup google.com (DNS lookup).',
     links:'Windows networking commands | https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/'},

    // T07 — Socket Programming
    {id:'vpn-s15',topic_id:'vpn-t07',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'Build a TCP echo server in Go',
     description:'Write a server that listens for connections and echoes back what it receives.',
     notes:'net.Listen("tcp", ":8080") → l.Accept() → go handle(conn). In handle: io.Copy(conn, conn) to echo. Test with: telnet localhost 8080',
     links:'Go TCP server example | https://gobyexample.com/tcp-server'},
    {id:'vpn-s16',topic_id:'vpn-t07',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'Build a TCP chat client in Go',
     description:'Write a client that connects to the server and exchanges messages.',
     notes:'net.Dial("tcp", "localhost:8080") → conn.Write([]byte("hello")) → io.ReadAll(conn). Run server in one terminal, client in another.',
     links:'Go TCP client example | https://gobyexample.com/tcp-client'},
    {id:'vpn-s17',topic_id:'vpn-t07',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'HTTP requests in Go — fetch a web page',
     description:'Use Go\'s net/http to make a real web request.',
     notes:'http.Get("https://example.com") → io.ReadAll(resp.Body). Add headers: req.Header.Set("User-Agent", "my-vpn"). This is what the Outline SDK does under the hood.',
     links:'Go HTTP client | https://gobyexample.com/http-clients\nGo net/http docs | https://pkg.go.dev/net/http'},

    // T11 — Wintun
    {id:'vpn-s18',topic_id:'vpn-t11',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'Read the Wintun documentation',
     description:'Understand what Wintun does before writing any code.',
     notes:'Wintun creates a "TUN" device — a virtual Layer 3 network adapter. Your program reads and writes raw IP packets to it like reading/writing a file. No device drivers needed on your end — wintun.dll handles that.',
     links:'Wintun Site | https://wintun.net/'},
    {id:'vpn-s19',topic_id:'vpn-t11',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'Create a Wintun adapter in Go',
     description:'Use the Go bindings to programmatically create a virtual network adapter.',
     notes:'import wintun "golang.zx2c4.com/wintun". wintun.CreateAdapter("MyVPN", "Wintun", nil). Must run as Administrator. Returns adapter object to read/write packets.',
     links:'Wintun Go API | https://pkg.go.dev/golang.zx2c4.com/wintun\nWintun GitHub | https://github.com/WireGuard/wintun'},
    {id:'vpn-s20',topic_id:'vpn-t11',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'Read and write IP packets via Wintun',
     description:'Learn the packet I/O loop — the core of the VPN data path.',
     notes:'session := adapter.StartSession(0x800000). Receive: session.ReceivePacket() → raw IP packet bytes. Send: session.AllocateSendPacket(size) → fill packet → session.SendPacket(). Use goroutines: one for receive loop, one for send loop.',
     links:'Wintun session API | https://pkg.go.dev/golang.zx2c4.com/wintun#Session'},

    // T15 — Outline SDK
    {id:'vpn-s21',topic_id:'vpn-t15',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'Clone and build the Outline SDK',
     description:'Get the SDK running locally before writing your integration.',
     notes:'git clone https://github.com/Jigsaw-Code/outline-sdk\ncd outline-sdk\ngo build ./... (build all packages)\ncd x/examples/outline-cli\ngo build -o outline-cli.exe\noutline-cli.exe --help',
     links:'Outline SDK | https://github.com/Jigsaw-Code/outline-sdk'},
    {id:'vpn-s22',topic_id:'vpn-t15',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'Run the outline-cli example with a test key',
     description:'Get a real Shadowsocks access key and use the CLI to make a proxied request.',
     notes:'You can get a free test key from Outline\'s own servers or set up your own with outline-server on DigitalOcean. Then: ./outline-cli --access-key "ss://..." --transport tcp https://whatismyip.com. It should show the server\'s IP.',
     links:'Outline Manager (get keys) | https://getoutline.org/en/home\nOutline Server on DigitalOcean | https://www.digitalocean.com/'},
    {id:'vpn-s23',topic_id:'vpn-t15',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'Study the SDK architecture — key interfaces',
     description:'Read and understand the core interfaces before writing integration code.',
     notes:'Key files to read:\n• transport/shadowsocks/client.go — Shadowsocks dialer\n• network/ip_device.go — IPDevice interface (this is what Wintun implements)\n• network/tcp_handler.go — how TCP is handled inside the tunnel\n• x/tun2socks — the TUN-to-SOCKS bridge implementation',
     links:'Outline SDK Go docs | https://pkg.go.dev/github.com/Jigsaw-Code/outline-sdk'},

    // T17 — Wails GUI
    {id:'vpn-s24',topic_id:'vpn-t17',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'Install Wails and create a skeleton project',
     description:'Get Wails running and understand the project structure.',
     notes:'go install github.com/wailsapp/wails/v2/cmd/wails@latest\nwails doctor (check dependencies)\nwails init -n vpn-client -t vanilla\nwails dev (start hot-reload dev server)\nOpens a window with a basic UI.',
     links:'Wails Installation | https://wails.io/docs/gettingstarted/installation'},
    {id:'vpn-s25',topic_id:'vpn-t17',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'Expose Go functions to the JavaScript frontend',
     description:'Bridge your VPN Go logic to the HTML/JS UI.',
     notes:'In app.go: func (a *App) Connect(accessKey string) string { ... }. In app startup: wails.Run(options) with Bind: []interface{}{app}. In JS: window.go.main.App.Connect(key).then(result => ...).',
     links:'Wails Binding Guide | https://wails.io/docs/guides/application-development'},
    {id:'vpn-s26',topic_id:'vpn-t17',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'Design the VPN UI — access key input and connect button',
     description:'Build the minimal UI: paste key → click connect → see status.',
     notes:'Min UI elements:\n• <textarea> for access key paste\n• <button> for Connect/Disconnect\n• Status indicator div (green "Connected" / red "Disconnected")\n• Log area for connection events\nStyle with CSS — dark theme recommended.',
     links:'Wails frontend docs | https://wails.io/docs/guides/frontend'},

    // T20 — Testing
    {id:'vpn-s27',topic_id:'vpn-t20',project_id:VPN_PROJECT_ID,order_index:1,completed:false,
     title:'IP leak test — verify your real IP is hidden',
     description:'Confirm your VPN is actually routing traffic through the server.',
     notes:'While connected: visit https://whatismyip.com. The IP shown should be your VPN server\'s IP, NOT your home internet IP. Also try: curl https://httpbin.org/ip from a terminal.',
     links:'WhatIsMyIP | https://www.whatismyip.com/\nhttpbin.org/ip | https://httpbin.org/ip'},
    {id:'vpn-s28',topic_id:'vpn-t20',project_id:VPN_PROJECT_ID,order_index:2,completed:false,
     title:'DNS leak test — verify DNS queries are private',
     description:'Ensure no DNS queries bypass the VPN tunnel.',
     notes:'While connected: visit https://www.dnsleaktest.com and run the extended test. You should only see DNS servers associated with your VPN provider. If you see your ISP\'s DNS servers, you have a leak.',
     links:'DNS Leak Test | https://www.dnsleaktest.com/'},
    {id:'vpn-s29',topic_id:'vpn-t20',project_id:VPN_PROJECT_ID,order_index:3,completed:false,
     title:'Wireshark verification — traffic is encrypted',
     description:'Use Wireshark to confirm your traffic is actually encrypted before leaving your computer.',
     notes:'Open Wireshark → select your real network adapter (WiFi or Ethernet). Connect to VPN. Filter by your VPN server IP. You should see packets but NOT be able to read the payload content. If you can read it, something is wrong.',
     links:'Wireshark | https://www.wireshark.org/'},
    {id:'vpn-s30',topic_id:'vpn-t20',project_id:VPN_PROJECT_ID,order_index:4,completed:false,
     title:'Package for distribution — build a Windows installer',
     description:'Create a shareable installer with your VPN app and all dependencies.',
     notes:'1. wails build → creates vpn-client.exe + wintun.dll in build/windows/\n2. Download Inno Setup from jrsoftware.org\n3. Create an .iss script that bundles vpn-client.exe + wintun.dll + a redistributable VC runtime\n4. Compile → get a single MyVPN-Setup.exe installer.',
     links:'Wails Build | https://wails.io/docs/reference/cli#build\nInno Setup | https://jrsoftware.org/isinfo.php'},
  ],
};

// ============================================================
// SEED DATA — Self-Hosted Universal Document Extraction API
// ============================================================
const DOC_PROJECT_ID = 'doc-extract-api-v1';

const DOC_SEED = {
  project: {
    id: DOC_PROJECT_ID,
    name: 'Self-Hosted Universal Document Extraction API',
    description: 'Build a universal document extraction API from scratch using Python, FastAPI, Streamlit, Docker, IBM Docling, and MarkItDown.',
    language: 'Python',
    status: 'active',
    color: '#8b5cf6',
    created_at: Date.now() - 1800000,
  },
  topics: [
    {
      id: 'doc-t01', project_id: DOC_PROJECT_ID, order_index: 1,
      title: 'Modern Python Environment & Toolchain',
      description: 'Setting up the foundational architecture, dependency management, and virtual environments using modern Rust-based tooling (uv).',
      priority: 'high', tag: 'Phase 1', completed: false,
      notes: 'Focus on setting up a deterministic build environment using pyproject.toml and uv.lock. Utilize Astral uv for fast environment isolation and package management.',
      links: 'Astral uv Project Layout Documentation | https://docs.astral.sh/uv/concepts/projects/layout/'
    },
    {
      id: 'doc-t02', project_id: DOC_PROJECT_ID, order_index: 2,
      title: 'Document Processing Fundamentals',
      description: 'Understand core document formats, text extraction concepts, OCR vs native text, and structured data.',
      priority: 'high', tag: 'Phase 1', completed: false,
      notes: 'Key concepts: PDF internals, DOCX/PPTX structures, layout analysis, table detection, and metadata extraction.',
      links: ''
    },
    {
      id: 'doc-t03', project_id: DOC_PROJECT_ID, order_index: 3,
      title: 'IBM Docling',
      description: 'Complex PDF parsing, layout analysis, and table structure recognition.',
      priority: 'high', tag: 'Phase 2', completed: false,
      notes: 'Docling handles PDF internals and extracts text, tables, figures, and metadata. Important advanced features include chunking and semantic document structure.',
      links: 'IBM Docling Repository | https://github.com/docling-project/docling\nDocling Official Site | https://www.docling.ai/'
    },
    {
      id: 'doc-t04', project_id: DOC_PROJECT_ID, order_index: 4,
      title: 'Microsoft MarkItDown',
      description: 'Office document (Word, Excel, PowerPoint) and HTML conversion.',
      priority: 'high', tag: 'Phase 2', completed: false,
      notes: 'Used for DOCX formatting preservation, PPTX slide/notes extraction, and HTML DOM parsing into Markdown.',
      links: 'Microsoft MarkItDown Repository | https://github.com/microsoft/markitdown'
    },
    {
      id: 'doc-t05', project_id: DOC_PROJECT_ID, order_index: 5,
      title: 'Backend Development (FastAPI)',
      description: 'Building the microservice that accepts file uploads and serves structured output.',
      priority: 'high', tag: 'Phase 3', completed: false,
      notes: 'Use FastAPI for async REST API, python-multipart for binary streams, Pydantic for data validation, and Swagger for OpenAPI docs.',
      links: 'FastAPI Official Documentation | https://fastapi.tiangolo.com\nFastAPI Source Code | https://github.com/fastapi/fastapi'
    },
    {
      id: 'doc-t06', project_id: DOC_PROJECT_ID, order_index: 6,
      title: 'Document Processing Service Layer',
      description: 'Service architecture and routing logic for handling files.',
      priority: 'high', tag: 'Phase 3', completed: false,
      notes: 'Routing logic: PDF goes to Docling, Office docs and HTML go to MarkItDown. Implement MIME type/magic byte detection and unified output schema.',
      links: 'Python mimetypes | https://docs.python.org/3/library/mimetypes.html'
    },
    {
      id: 'doc-t07', project_id: DOC_PROJECT_ID, order_index: 7,
      title: 'Frontend Development (Streamlit)',
      description: 'Constructing the interactive dashboard for users to upload files and view results.',
      priority: 'medium', tag: 'Phase 4', completed: false,
      notes: 'Use st.file_uploader, st.markdown for UI. Implement session state and connect to the FastAPI backend via requests.',
      links: 'Streamlit Official Documentation | https://docs.streamlit.io\nStreamlit API Reference | https://docs.streamlit.io/develop/api-reference'
    },
    {
      id: 'doc-t08', project_id: DOC_PROJECT_ID, order_index: 8,
      title: 'Docker Fundamentals',
      description: 'Packaging the application into isolated, reproducible containers.',
      priority: 'high', tag: 'Phase 5', completed: false,
      notes: 'Write multi-stage Dockerfiles for Python to optimize image size. Manage volumes and container networking.',
      links: 'Docker Documentation | https://docs.docker.com/'
    },
    {
      id: 'doc-t09', project_id: DOC_PROJECT_ID, order_index: 9,
      title: 'Docker Compose',
      description: 'Orchestrating multi-container networking (Streamlit communicating with FastAPI).',
      priority: 'high', tag: 'Phase 5', completed: false,
      notes: 'Use compose.yaml to define FastAPI and Streamlit services, handling internal networking and environment variables.',
      links: 'Docker Compose Official Documentation | https://docs.docker.com/compose/\nDocker Compose CLI Reference | https://docs.docker.com/reference/cli/docker/compose/'
    },
    {
      id: 'doc-t10', project_id: DOC_PROJECT_ID, order_index: 10,
      title: 'API Security',
      description: 'File upload security, CORS, rate limiting, and secure deployment.',
      priority: 'medium', tag: 'Phase 6', completed: false,
      notes: 'Validate file sizes and extensions. Configure CORS policies for the Streamlit frontend. Use reverse proxies for HTTPS.',
      links: 'FastAPI CORS | https://fastapi.tiangolo.com/tutorial/cors/'
    },
    {
      id: 'doc-t11', project_id: DOC_PROJECT_ID, order_index: 11,
      title: 'Logging & Monitoring',
      description: 'Implement structured logging and health checks.',
      priority: 'low', tag: 'Phase 6', completed: false,
      notes: 'JSON context logs. Track extraction errors and monitor endpoint health.',
      links: 'Python Logging | https://docs.python.org/3/library/logging.html'
    },
    {
      id: 'doc-t12', project_id: DOC_PROJECT_ID, order_index: 12,
      title: 'Deployment',
      description: 'Deploy the self-hosted solution to a VPS or server.',
      priority: 'medium', tag: 'Phase 6', completed: false,
      notes: 'Local deployment with Docker Compose, Nginx reverse proxy configuration, and SSL.',
      links: 'Nginx Reverse Proxy | https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/'
    },
    {
      id: 'doc-t13', project_id: DOC_PROJECT_ID, order_index: 13,
      title: 'Advanced Enhancements',
      description: 'Tesseract OCR, document summarization, RAG preparation, and background queues.',
      priority: 'low', tag: 'Phase 7', completed: false,
      notes: 'For heavy files, use Celery/Redis background task workers. Pre-process text for RAG pipelines.',
      links: 'Celery Docs | https://docs.celeryq.dev/en/stable/'
    }
  ],
  subtopics: [
    {id: 'doc-s0101', topic_id: 'doc-t01', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Python installation and versions (3.10, 3.11, 3.12)', completed: false, description: '', notes: 'Ensure Python is correctly added to PATH.', links: ''},
    {id: 'doc-s0102', topic_id: 'doc-t01', project_id: DOC_PROJECT_ID, order_index: 2, title: 'Project Structure (src/ layout, modular config)', completed: false, description: '', notes: 'Set up a single-file vs package layout.', links: ''},
    {id: 'doc-s0103', topic_id: 'doc-t01', project_id: DOC_PROJECT_ID, order_index: 3, title: 'Dependency Management (pip, pyproject.toml)', completed: false, description: '', notes: 'Manage semantic versioning and dependency locking.', links: ''},
    {id: 'doc-s0104', topic_id: 'doc-t01', project_id: DOC_PROJECT_ID, order_index: 4, title: 'UV Package Manager', completed: false, description: '', notes: 'Run uv sync, uv add, uv remove, and utilize uv.lock.', links: ''},
    {id: 'doc-s0105', topic_id: 'doc-t01', project_id: DOC_PROJECT_ID, order_index: 5, title: 'Code Quality (Ruff, Black, mypy, pre-commit)', completed: false, description: '', notes: 'Configure linters and formatters.', links: ''},
    {id: 'doc-s0106', topic_id: 'doc-t01', project_id: DOC_PROJECT_ID, order_index: 6, title: 'Configuration & Secrets', completed: false, description: '', notes: 'Setup .env files and python-dotenv.', links: ''},
    {id: 'doc-s0201', topic_id: 'doc-t02', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Understanding Document Formats', completed: false, description: '', notes: 'Learn PDF internals, DOCX, PPTX, XLSX, HTML, and Markdown.', links: ''},
    {id: 'doc-s0202', topic_id: 'doc-t02', project_id: DOC_PROJECT_ID, order_index: 2, title: 'Text Extraction Concepts', completed: false, description: '', notes: 'Understand OCR, reading order, layout analysis, table & image extraction.', links: ''},
    {id: 'doc-s0203', topic_id: 'doc-t02', project_id: DOC_PROJECT_ID, order_index: 3, title: 'Structured Data Formats', completed: false, description: '', notes: 'Familiarize with JSON, Markdown, YAML, CSV, and XML.', links: ''},
    {id: 'doc-s0301', topic_id: 'doc-t03', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Introduction to Docling', completed: false, description: '', notes: 'Understand architecture and supported formats.', links: ''},
    {id: 'doc-s0302', topic_id: 'doc-t03', project_id: DOC_PROJECT_ID, order_index: 2, title: 'PDF Processing', completed: false, description: '', notes: 'Perform layout recognition and table/figure extraction.', links: ''},
    {id: 'doc-s0303', topic_id: 'doc-t03', project_id: DOC_PROJECT_ID, order_index: 3, title: 'OCR integration', completed: false, description: '', notes: 'Handle scanned and image-based PDFs.', links: ''},
    {id: 'doc-s0304', topic_id: 'doc-t03', project_id: DOC_PROJECT_ID, order_index: 4, title: 'Advanced Docling Features', completed: false, description: '', notes: 'Implement chunking, document hierarchy, and page segmentation.', links: ''},
    {id: 'doc-s0305', topic_id: 'doc-t03', project_id: DOC_PROJECT_ID, order_index: 5, title: 'Output Formats & Optimization', completed: false, description: '', notes: 'Convert to Markdown/JSON efficiently, optimizing memory for large docs.', links: ''},
    {id: 'doc-s0401', topic_id: 'doc-t04', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Introduction and Purpose', completed: false, description: '', notes: 'Learn MarkItDown architecture.', links: ''},
    {id: 'doc-s0402', topic_id: 'doc-t04', project_id: DOC_PROJECT_ID, order_index: 2, title: 'Word (DOCX) Processing', completed: false, description: '', notes: 'Convert DOCX while preserving formatting and tables.', links: ''},
    {id: 'doc-s0403', topic_id: 'doc-t04', project_id: DOC_PROJECT_ID, order_index: 3, title: 'PowerPoint (PPTX) Processing', completed: false, description: '', notes: 'Extract slides, speaker notes, and embedded images.', links: ''},
    {id: 'doc-s0404', topic_id: 'doc-t04', project_id: DOC_PROJECT_ID, order_index: 4, title: 'Excel (XLSX) Processing', completed: false, description: '', notes: 'Extract worksheets, tables, and cell formatting.', links: ''},
    {id: 'doc-s0405', topic_id: 'doc-t04', project_id: DOC_PROJECT_ID, order_index: 5, title: 'HTML Conversion & Output Standardization', completed: false, description: '', notes: 'Parse DOM to Markdown, clean up Markdown, ensure consistency.', links: ''},
    {id: 'doc-s0501', topic_id: 'doc-t05', project_id: DOC_PROJECT_ID, order_index: 1, title: 'API Fundamentals', completed: false, description: '', notes: 'Understand HTTP protocol, REST APIs, and status codes.', links: ''},
    {id: 'doc-s0502', topic_id: 'doc-t05', project_id: DOC_PROJECT_ID, order_index: 2, title: 'FastAPI Basics (Routes, Endpoints)', completed: false, description: '', notes: 'Handle path and query parameters.', links: ''},
    {id: 'doc-s0503', topic_id: 'doc-t05', project_id: DOC_PROJECT_ID, order_index: 3, title: 'Data Validation with Pydantic', completed: false, description: '', notes: 'Create strict request/response models.', links: ''},
    {id: 'doc-s0504', topic_id: 'doc-t05', project_id: DOC_PROJECT_ID, order_index: 4, title: 'Async Programming', completed: false, description: '', notes: 'Use asyncio and event loop for concurrent requests.', links: ''},
    {id: 'doc-s0505', topic_id: 'doc-t05', project_id: DOC_PROJECT_ID, order_index: 5, title: 'File Upload Handling', completed: false, description: '', notes: 'Manage multipart forms, UploadFile, and temporary storage.', links: ''},
    {id: 'doc-s0506', topic_id: 'doc-t05', project_id: DOC_PROJECT_ID, order_index: 6, title: 'Error Handling & Middleware', completed: false, description: '', notes: 'Handle HTTPException, setup logging, CORS, and auth middleware.', links: ''},
    {id: 'doc-s0507', topic_id: 'doc-t05', project_id: DOC_PROJECT_ID, order_index: 7, title: 'Dependency Injection & Testing', completed: false, description: '', notes: 'Use Depends for shared services. Test APIs with pytest and TestClient.', links: ''},
    {id: 'doc-s0601', topic_id: 'doc-t06', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Service Architecture & Pipeline', completed: false, description: '', notes: 'Implement upload -> validation -> extraction -> transformation -> output.', links: ''},
    {id: 'doc-s0602', topic_id: 'doc-t06', project_id: DOC_PROJECT_ID, order_index: 2, title: 'File Type Detection', completed: false, description: '', notes: 'Detect MIME types and validate Magic bytes.', links: ''},
    {id: 'doc-s0603', topic_id: 'doc-t06', project_id: DOC_PROJECT_ID, order_index: 3, title: 'Routing Logic', completed: false, description: '', notes: 'Route PDF to Docling, Office docs/HTML to MarkItDown.', links: ''},
    {id: 'doc-s0604', topic_id: 'doc-t06', project_id: DOC_PROJECT_ID, order_index: 4, title: 'Result Standardization', completed: false, description: '', notes: 'Format metadata and output content consistently.', links: ''},
    {id: 'doc-s0701', topic_id: 'doc-t07', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Streamlit Fundamentals', completed: false, description: '', notes: 'Learn app structure, widgets, and layout system.', links: ''},
    {id: 'doc-s0702', topic_id: 'doc-t07', project_id: DOC_PROJECT_ID, order_index: 2, title: 'User Inputs & State Management', completed: false, description: '', notes: 'Manage file uploaders, session state, and user interactions.', links: ''},
    {id: 'doc-s0703', topic_id: 'doc-t07', project_id: DOC_PROJECT_ID, order_index: 3, title: 'API Communication', completed: false, description: '', notes: 'Use requests to send files to FastAPI.', links: ''},
    {id: 'doc-s0704', topic_id: 'doc-t07', project_id: DOC_PROJECT_ID, order_index: 4, title: 'Data Display & UX', completed: false, description: '', notes: 'Render Markdown/JSON, add download buttons, loaders, and notifications.', links: ''},
    {id: 'doc-s0801', topic_id: 'doc-t08', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Container Basics & CLI', completed: false, description: '', notes: 'Learn images, registries, and commands (build, run, exec, logs).', links: ''},
    {id: 'doc-s0802', topic_id: 'doc-t08', project_id: DOC_PROJECT_ID, order_index: 2, title: 'Dockerfiles & Multi-stage Builds', completed: false, description: '', notes: 'Optimize images with builder layers and runtime stages.', links: ''},
    {id: 'doc-s0803', topic_id: 'doc-t08', project_id: DOC_PROJECT_ID, order_index: 3, title: 'Volumes & Networking', completed: false, description: '', notes: 'Setup persistent bind mounts and expose container ports.', links: ''},
    {id: 'doc-s0901', topic_id: 'doc-t09', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Compose Fundamentals', completed: false, description: '', notes: 'Define compose.yaml with networks and volumes.', links: ''},
    {id: 'doc-s0902', topic_id: 'doc-t09', project_id: DOC_PROJECT_ID, order_index: 2, title: 'Multi-Service Applications', completed: false, description: '', notes: 'Link FastAPI backend with Streamlit frontend over internal networks.', links: ''},
    {id: 'doc-s0903', topic_id: 'doc-t09', project_id: DOC_PROJECT_ID, order_index: 3, title: 'Environment Variables & Scaling', completed: false, description: '', notes: 'Pass configuration via env files and handle multiple instances.', links: ''},
    {id: 'doc-s1001', topic_id: 'doc-t10', project_id: DOC_PROJECT_ID, order_index: 1, title: 'File Upload Security', completed: false, description: '', notes: 'Enforce size limits and check for malware.', links: ''},
    {id: 'doc-s1002', topic_id: 'doc-t10', project_id: DOC_PROJECT_ID, order_index: 2, title: 'API Security & CORS', completed: false, description: '', notes: 'Implement rate limiting, Auth, and Cross-origin policies.', links: ''},
    {id: 'doc-s1101', topic_id: 'doc-t11', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Structured Logging', completed: false, description: '', notes: 'Implement JSON and contextual logs.', links: ''},
    {id: 'doc-s1102', topic_id: 'doc-t11', project_id: DOC_PROJECT_ID, order_index: 2, title: 'Monitoring & Health checks', completed: false, description: '', notes: 'Track errors and create a /health endpoint.', links: ''},
    {id: 'doc-s1201', topic_id: 'doc-t12', project_id: DOC_PROJECT_ID, order_index: 1, title: 'Server Deployment & Reverse Proxy', completed: false, description: '', notes: 'Deploy to Linux VPS. Configure Nginx and SSL.', links: ''},
    {id: 'doc-s1301', topic_id: 'doc-t13', project_id: DOC_PROJECT_ID, order_index: 1, title: 'OCR & AI Enhancements', completed: false, description: '', notes: 'Add Tesseract, doc summarization, and RAG preparation.', links: ''},
    {id: 'doc-s1302', topic_id: 'doc-t13', project_id: DOC_PROJECT_ID, order_index: 2, title: 'Queues, Background Tasks & Scalability', completed: false, description: '', notes: 'Implement Celery/Redis for long tasks. Set up load balancing.', links: ''}
  ]
};

// ============================================================
// LOCAL STORAGE DATA LAYER
// ============================================================
function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function lsSet(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadAll() {
  let projects  = lsGet(KEYS.projects);
  let topics    = lsGet(KEYS.topics);
  let subtopics = lsGet(KEYS.subtopics);

  // First run — seed projects
  if (!projects) {
    projects  = [BT_SEED.project, VPN_SEED.project, DOC_SEED.project];
    topics    = [...BT_SEED.topics, ...VPN_SEED.topics, ...DOC_SEED.topics];
    subtopics = [...BT_SEED.subtopics, ...VPN_SEED.subtopics, ...DOC_SEED.subtopics];
    lsSet(KEYS.projects, projects);
    lsSet(KEYS.topics, topics);
    lsSet(KEYS.subtopics, subtopics);
  } else {
    // Migrate existing data: backfill 'links' field from BT seed if missing
    let changed = false;
    if (topics) {
      topics = topics.map(t => {
        if (!t.links) {
          const seed = BT_SEED.topics.find(s => s.id === t.id);
          if (seed && seed.links) { changed = true; return { ...t, links: seed.links }; }
        }
        return t;
      });
    }
    if (subtopics) {
      subtopics = subtopics.map(s => {
        if (!s.links) {
          const seed = BT_SEED.subtopics.find(x => x.id === s.id);
          if (seed && seed.links) { changed = true; return { ...s, links: seed.links }; }
        }
        return s;
      });
    }

    // Inject VPN project if not already present (migration for existing users)
    if (!projects.find(p => p.id === VPN_PROJECT_ID)) {
      projects = [...projects, VPN_SEED.project];
      topics   = [...(topics || []), ...VPN_SEED.topics];
      subtopics = [...(subtopics || []), ...VPN_SEED.subtopics];
      changed = true;
    }

    // Inject DOC project if not already present
    if (!projects.find(p => p.id === DOC_PROJECT_ID)) {
      projects = [...projects, DOC_SEED.project];
      topics   = [...(topics || []), ...DOC_SEED.topics];
      subtopics = [...(subtopics || []), ...DOC_SEED.subtopics];
      changed = true;
    }

    if (changed) {
      lsSet(KEYS.projects, projects);
      lsSet(KEYS.topics, topics);
      lsSet(KEYS.subtopics, subtopics);
    }
  }

  State.projects  = projects  || [];
  State.topics    = topics    || [];
  State.subtopics = subtopics || [];
}

function saveProjects()  { lsSet(KEYS.projects,  State.projects);  }
function saveTopics()    { lsSet(KEYS.topics,    State.topics);    }
function saveSubtopics() { lsSet(KEYS.subtopics, State.subtopics); }

// ============================================================
// INIT
// ============================================================
function init() {
  loadAll();
  renderSidebarProjects();
  renderDashboard();
  renderProjectsList();
  renderAllTodos();
  setupKeyboard();

  // Auto-open BitTorrent project only if it's the sole project
  const btProj = State.projects.find(p => p.id === BT_PROJECT_ID);
  if (btProj && State.projects.length === 1) {
    // Small delay so DOM settles
    setTimeout(() => switchView('project-detail', BT_PROJECT_ID), 50);
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function switchView(view, projectId = null) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const viewEl = document.getElementById(`view-${view}`);
  if (viewEl) viewEl.classList.add('active-view');

  const navEl = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (navEl) navEl.classList.add('active');

  State.currentView = view;

  const bc = document.getElementById('breadcrumb');
  if (view === 'project-detail' && projectId) {
    State.currentProjectId = projectId;
    const proj = State.projects.find(p => p.id === projectId);
    bc.innerHTML = `<span onclick="switchView('projects')" style="cursor:pointer;color:var(--text-muted)">Projects</span><span class="sep">›</span><span>${proj ? esc(proj.name) : 'Project'}</span>`;
    renderProjectDetail(projectId);
    highlightProjectNav(projectId);
  } else {
    const labels = { dashboard: 'Dashboard', projects: 'Projects', todos: 'All To-Dos' };
    bc.innerHTML = `<span>${labels[view] || view}</span>`;
  }

  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('mobile-open');
  }
}

function highlightProjectNav(projectId) {
  document.querySelectorAll('.project-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.projectId === projectId);
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 900) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
    document.getElementById('main-content').classList.toggle('expanded');
  }
}

document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const { projects, topics, subtopics } = State;
  const done    = topics.filter(t => t.completed).length;
  const pending = topics.length - done;

  document.getElementById('stat-projects').textContent = projects.length;
  document.getElementById('stat-topics').textContent   = topics.length;
  document.getElementById('stat-done').textContent     = done;
  document.getElementById('stat-pending').textContent  = pending;

  // Projects overview
  const dpEl = document.getElementById('dashboard-projects');
  if (!projects.length) {
    dpEl.innerHTML = '<p class="empty-hint">No projects yet. Create your first one!</p>';
  } else {
    dpEl.innerHTML = projects.map(p => {
      const pTopics = topics.filter(t => t.project_id === p.id);
      const pDone   = pTopics.filter(t => t.completed).length;
      const pct     = pTopics.length ? Math.round((pDone / pTopics.length) * 100) : 0;
      return `
        <div class="dash-proj-item" onclick="switchView('project-detail','${p.id}')">
          <div class="dash-proj-dot" style="background:${p.color || '#6366f1'}"></div>
          <div class="dash-proj-info">
            <div class="dash-proj-name">${esc(p.name)}</div>
            <div class="dash-proj-progress-wrap">
              <div class="dash-mini-bar"><div class="dash-mini-bar-inner" style="width:${pct}%;background:${p.color || '#6366f1'}"></div></div>
              <span class="dash-proj-pct">${pct}%</span>
            </div>
          </div>
          <i class="fa-solid fa-chevron-right" style="color:var(--text-dim);font-size:11px;"></i>
        </div>`;
    }).join('');
  }

  // Recent activity
  const ra   = document.getElementById('recent-activity');
  const acts = getActivity();
  if (!acts.length) {
    ra.innerHTML = '<p class="empty-hint">No recent activity yet.</p>';
  } else {
    ra.innerHTML = acts.slice(0, 8).map(a => `
      <div class="activity-item">
        <div class="activity-icon" style="background:${a.color || 'var(--accent-glow)'};color:${a.iconColor || 'var(--accent)'}">
          <i class="fa-solid ${a.icon || 'fa-circle-dot'}"></i>
        </div>
        <div>
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${timeAgo(a.time)}</div>
        </div>
      </div>`).join('');
  }
}

// ============================================================
// ACTIVITY LOG
// ============================================================
function getActivity() {
  try { return JSON.parse(localStorage.getItem(KEYS.activity) || '[]'); } catch { return []; }
}
function logActivity(text, icon = 'fa-circle-dot', iconColor = 'var(--accent)', bg = 'var(--accent-glow)') {
  const acts = getActivity();
  acts.unshift({ text, icon, iconColor, color: bg, time: Date.now() });
  localStorage.setItem(KEYS.activity, JSON.stringify(acts.slice(0, 30)));
}

// ============================================================
// PROJECTS LIST
// ============================================================
function renderProjectsList() {
  const { projects, topics } = State;
  const grid = document.getElementById('projects-grid');
  if (!projects.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i class="fa-solid fa-folder-open"></i>
        <h3>No projects yet</h3>
        <p>Click "New Project" to get started.</p>
      </div>`;
    return;
  }
  grid.innerHTML = projects.map(p => {
    const pTopics = topics.filter(t => t.project_id === p.id);
    const pDone   = pTopics.filter(t => t.completed).length;
    const pct     = pTopics.length ? Math.round((pDone / pTopics.length) * 100) : 0;
    return `
      <div class="project-card" onclick="switchView('project-detail','${p.id}')">
        <div class="project-card-accent" style="background:${p.color || '#6366f1'}"></div>
        <div class="project-card-body">
          <div class="project-card-top">
            <div class="project-card-icon" style="background:${p.color || '#6366f1'}">
              <i class="fa-solid fa-code"></i>
            </div>
            <div class="project-card-menu" onclick="event.stopPropagation()">
              <button class="project-card-menu-btn" onclick="toggleProjectMenu('${p.id}')">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
              <div class="dropdown-menu hidden" id="proj-menu-${p.id}">
                <div class="dropdown-item" onclick="openEditProjectModal('${p.id}')">
                  <i class="fa-solid fa-pen"></i> Edit
                </div>
                <div class="dropdown-item danger" onclick="confirmDeleteProject('${p.id}')">
                  <i class="fa-solid fa-trash"></i> Delete
                </div>
              </div>
            </div>
          </div>
          <div class="project-card-name">${esc(p.name)}</div>
          <div class="project-card-desc">${esc(p.description || 'No description.')}</div>
          <div class="project-card-meta">
            ${p.language ? `<span class="lang-badge">${esc(p.language)}</span>` : ''}
            <span class="status-badge status-${p.status || 'active'}">${p.status || 'active'}</span>
            <span style="font-size:11px;color:var(--text-dim)">${pTopics.length} topics</span>
          </div>
          <div class="project-card-progress">
            <div class="progress-info">
              <span>${pDone}/${pTopics.length} done</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar-outer">
              <div class="progress-bar-inner" style="width:${pct}%;background:${p.color || '#6366f1'}"></div>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function toggleProjectMenu(id) {
  const menus = document.querySelectorAll('.dropdown-menu');
  menus.forEach(m => { if (m.id !== `proj-menu-${id}`) m.classList.add('hidden'); });
  document.getElementById(`proj-menu-${id}`)?.classList.toggle('hidden');
}
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
});

// ============================================================
// SIDEBAR PROJECTS
// ============================================================
function renderSidebarProjects() {
  const el  = document.getElementById('project-nav-list');
  const sel = document.getElementById('todo-filter-project');
  sel.innerHTML = '<option value="">All Projects</option>';
  if (!State.projects.length) {
    el.innerHTML = '<div class="nav-loading">No projects yet.</div>';
    return;
  }
  el.innerHTML = State.projects.map(p => `
    <div class="project-nav-item" data-project-id="${p.id}" onclick="switchView('project-detail','${p.id}')">
      <div class="project-nav-dot" style="background:${p.color || '#6366f1'}"></div>
      <span>${esc(p.name)}</span>
    </div>`).join('');
  State.projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

// ============================================================
// PROJECT MODAL (Create / Edit)
// ============================================================
function openNewProjectModal() {
  State.editingProjectId = null;
  document.getElementById('modal-project-title').textContent = 'New Project';
  document.getElementById('proj-name').value   = '';
  document.getElementById('proj-desc').value   = '';
  document.getElementById('proj-lang').value   = '';
  document.getElementById('proj-status').value = 'active';
  selectColor('#6366f1', document.querySelector('.color-dot[data-color="#6366f1"]'));
  openModal('modal-project');
  setTimeout(() => document.getElementById('proj-name').focus(), 50);
}

function openEditProjectModal(id) {
  const p = State.projects.find(x => x.id === id);
  if (!p) return;
  State.editingProjectId = id;
  document.getElementById('modal-project-title').textContent = 'Edit Project';
  document.getElementById('proj-name').value   = p.name        || '';
  document.getElementById('proj-desc').value   = p.description || '';
  document.getElementById('proj-lang').value   = p.language    || '';
  document.getElementById('proj-status').value = p.status      || 'active';
  selectColor(p.color || '#6366f1', document.querySelector(`.color-dot[data-color="${p.color || '#6366f1'}"]`));
  openModal('modal-project');
}

function editCurrentProject() {
  if (State.currentProjectId) openEditProjectModal(State.currentProjectId);
}

function saveProject() {
  const name = document.getElementById('proj-name').value.trim();
  if (!name) { showToast('Project name is required.', 'error'); return; }
  const data = {
    name,
    description: document.getElementById('proj-desc').value.trim(),
    language:    document.getElementById('proj-lang').value.trim(),
    status:      document.getElementById('proj-status').value,
    color:       State.selectedColor,
  };
  if (State.editingProjectId) {
    const idx = State.projects.findIndex(p => p.id === State.editingProjectId);
    if (idx > -1) State.projects[idx] = { ...State.projects[idx], ...data };
    saveProjects();
    logActivity(`Updated project <strong>${esc(name)}</strong>`, 'fa-pen', '#6366f1');
    showToast('Project updated!', 'success');
  } else {
    const newProj = { ...data, id: uuid(), created_at: Date.now() };
    State.projects.push(newProj);
    saveProjects();
    logActivity(`Created project <strong>${esc(name)}</strong>`, 'fa-folder-plus', State.selectedColor);
    showToast('Project created!', 'success');
  }
  closeModal('modal-project');
  renderSidebarProjects();
  renderProjectsList();
  renderDashboard();
}

function selectColor(color, el) {
  State.selectedColor = color;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

function confirmDeleteProject(id) {
  const p = State.projects.find(x => x.id === id);
  openConfirm(`Delete "${p?.name}"?`, 'This will delete the project and all its topics. Cannot be undone.', () => {
    const tids = State.topics.filter(t => t.project_id === id).map(t => t.id);
    State.subtopics = State.subtopics.filter(s => !tids.includes(s.topic_id));
    State.topics    = State.topics.filter(t => t.project_id !== id);
    State.projects  = State.projects.filter(p => p.id !== id);
    saveProjects(); saveTopics(); saveSubtopics();
    logActivity(`Deleted project <strong>${esc(p?.name)}</strong>`, 'fa-trash', '#ef4444');
    showToast('Project deleted.', 'info');
    renderSidebarProjects();
    renderProjectsList();
    renderDashboard();
    if (State.currentProjectId === id) switchView('projects');
  });
}

// ============================================================
// PROJECT DETAIL
// ============================================================
function renderProjectDetail(projectId) {
  const proj = State.projects.find(p => p.id === projectId);
  if (!proj) return;

  document.getElementById('detail-project-name').textContent = proj.name;
  document.getElementById('detail-project-desc').textContent = proj.description || '';
  const badge = document.getElementById('detail-project-badge');
  badge.style.background = proj.color || '#6366f1';

  updateProjectProgress(projectId);
  renderTopics(projectId);
}

function updateProjectProgress(projectId) {
  const topics = State.topics.filter(t => t.project_id === projectId);
  const done   = topics.filter(t => t.completed).length;
  const pct    = topics.length ? Math.round((done / topics.length) * 100) : 0;
  document.getElementById('detail-progress-label').textContent = `${pct}% Complete`;
  document.getElementById('detail-progress-count').textContent = `${done} / ${topics.length} topics done`;
  document.getElementById('detail-progress-bar').style.width  = `${pct}%`;
  const proj = State.projects.find(p => p.id === projectId);
  document.getElementById('detail-progress-bar').style.background = proj?.color || '#6366f1';
}

// ============================================================
// TOPICS
// ============================================================
function renderTopics(projectId) {
  const search = document.getElementById('topic-search-input')?.value?.toLowerCase() || '';
  const filter = State.topicFilter;
  let topics   = State.topics.filter(t => t.project_id === projectId);

  if (filter === 'pending')   topics = topics.filter(t => !t.completed);
  if (filter === 'completed') topics = topics.filter(t =>  t.completed);
  if (search) topics = topics.filter(t => t.title?.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));

  const container = document.getElementById('topics-container');
  container.className = `topics-container ${State.topicViewMode}-view`;

  if (!topics.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-book-open"></i>
        <h3>No topics found</h3>
        <p>${search ? 'Try a different search.' : 'Click "Add Topic" to get started.'}</p>
      </div>`;
    return;
  }

  const allTopics = State.topics.filter(t => t.project_id === projectId);
  container.innerHTML = topics.map(t => {
    const num      = allTopics.findIndex(x => x.id === t.id) + 1;
    const subs     = State.subtopics.filter(s => s.topic_id === t.id);
    const subDone  = subs.filter(s => s.completed).length;
    return `
      <div class="topic-card ${t.completed ? 'completed' : ''}" id="topic-card-${t.id}">
        <div class="topic-card-main" onclick="openTopicPanel('${t.id}')">
          <div class="topic-checkbox ${t.completed ? 'checked' : ''}" onclick="event.stopPropagation();toggleTopic('${t.id}')" title="Mark ${t.completed ? 'pending' : 'done'}">
            ${t.completed ? '<i class="fa-solid fa-check"></i>' : ''}
          </div>
          <span class="topic-num">${String(num).padStart(2, '0')}</span>
          <div class="topic-content">
            <div class="topic-title">${esc(t.title)}</div>
            ${t.description ? `<div class="topic-desc">${esc(t.description)}</div>` : ''}
          </div>
          <div class="topic-meta">
            ${t.priority ? `<span class="priority-badge priority-${t.priority}">${t.priority}</span>` : ''}
            ${t.tag ? `<span class="tag-badge">${esc(t.tag)}</span>` : ''}
            ${subs.length ? `<span class="subtopic-count"><i class="fa-solid fa-layer-group"></i>${subDone}/${subs.length}</span>` : ''}
          </div>
          <div class="topic-actions" onclick="event.stopPropagation()">
            ${subs.length ? `<button class="topic-action-btn" onclick="toggleSubtopics('${t.id}')" title="Subtopics"><i class="fa-solid fa-chevron-down"></i></button>` : ''}
            <button class="topic-action-btn" onclick="openEditTopicModal('${t.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="topic-action-btn danger" onclick="confirmDeleteTopic('${t.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        ${subs.length ? `
        <div class="topic-subtopics" id="subtopics-${t.id}">
          ${subs.map(s => `
            <div class="subtopic-item" onclick="openTopicPanel('${t.id}')">
              <div class="subtopic-checkbox ${s.completed ? 'checked' : ''}" onclick="event.stopPropagation();toggleSubtopic('${s.id}','${t.id}')">
                ${s.completed ? '<i class="fa-solid fa-check"></i>' : ''}
              </div>
              <div>
                <div class="subtopic-title ${s.completed ? 'done' : ''}">${esc(s.title)}</div>
                ${s.description ? `<div class="subtopic-desc">${esc(s.description)}</div>` : ''}
              </div>
              <div class="subtopic-actions" onclick="event.stopPropagation()">
                <button class="topic-action-btn" onclick="openEditSubtopicModal('${s.id}','${t.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="topic-action-btn danger" onclick="confirmDeleteSubtopic('${s.id}','${t.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>`).join('')}
        </div>` : ''}
      </div>`;
  }).join('');
}

function toggleSubtopics(topicId) {
  const el = document.getElementById(`subtopics-${topicId}`);
  el?.classList.toggle('open');
}

function filterTopics() { if (State.currentProjectId) renderTopics(State.currentProjectId); }

function setTopicFilter(f, btn) {
  State.topicFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (State.currentProjectId) renderTopics(State.currentProjectId);
}

function setTopicView(mode) {
  State.topicViewMode = mode;
  document.getElementById('view-list-btn').classList.toggle('active', mode === 'list');
  document.getElementById('view-grid-btn').classList.toggle('active', mode === 'grid');
  if (State.currentProjectId) renderTopics(State.currentProjectId);
}

function toggleTopic(topicId) {
  const t = State.topics.find(x => x.id === topicId);
  if (!t) return;
  t.completed = !t.completed;
  saveTopics();
  logActivity(
    `${t.completed ? 'Completed' : 'Reopened'} topic <strong>${esc(t.title)}</strong>`,
    t.completed ? 'fa-check-circle' : 'fa-rotate-left',
    t.completed ? '#10b981' : '#f59e0b'
  );
  renderTopics(State.currentProjectId);
  updateProjectProgress(State.currentProjectId);
  renderDashboard();
  renderAllTodos();
  if (State.panelTopicId === topicId) refreshPanelHeader(topicId);
}

function toggleSubtopic(subtopicId, topicId) {
  const s = State.subtopics.find(x => x.id === subtopicId);
  if (!s) return;
  s.completed = !s.completed;
  saveSubtopics();
  renderTopics(State.currentProjectId);
  if (State.panelTopicId === topicId) renderPanelSubtopics(topicId);
}

// ============================================================
// TOPIC MODAL (Create / Edit)
// ============================================================
function openAddTopicModal() {
  State.editingTopicId = null;
  document.getElementById('modal-topic-title').textContent = 'Add Topic';
  document.getElementById('topic-title-input').value    = '';
  document.getElementById('topic-desc-input').value     = '';
  document.getElementById('topic-priority-input').value = 'medium';
  document.getElementById('topic-tag-input').value      = '';
  document.getElementById('topic-notes-input').value    = '';
  document.getElementById('topic-links-input').value    = '';
  openModal('modal-topic');
  setTimeout(() => document.getElementById('topic-title-input').focus(), 50);
}

function openEditTopicModal(topicId) {
  const t = State.topics.find(x => x.id === topicId);
  if (!t) return;
  State.editingTopicId = topicId;
  document.getElementById('modal-topic-title').textContent = 'Edit Topic';
  document.getElementById('topic-title-input').value    = t.title       || '';
  document.getElementById('topic-desc-input').value     = t.description || '';
  document.getElementById('topic-priority-input').value = t.priority    || 'medium';
  document.getElementById('topic-tag-input').value      = t.tag         || '';
  document.getElementById('topic-notes-input').value    = t.notes       || '';
  document.getElementById('topic-links-input').value    = t.links       || '';
  openModal('modal-topic');
}

function saveTopic() {
  const title = document.getElementById('topic-title-input').value.trim();
  if (!title) { showToast('Topic title is required.', 'error'); return; }
  const data = {
    title,
    description: document.getElementById('topic-desc-input').value.trim(),
    priority:    document.getElementById('topic-priority-input').value,
    tag:         document.getElementById('topic-tag-input').value.trim(),
    notes:       document.getElementById('topic-notes-input').value.trim(),
    links:       document.getElementById('topic-links-input').value.trim(),
    project_id:  State.currentProjectId,
  };
  if (State.editingTopicId) {
    const idx = State.topics.findIndex(t => t.id === State.editingTopicId);
    if (idx > -1) State.topics[idx] = { ...State.topics[idx], ...data };
    saveTopics();
    logActivity(`Updated topic <strong>${esc(title)}</strong>`, 'fa-pen', '#6366f1');
    showToast('Topic updated!', 'success');
  } else {
    const maxOrder = Math.max(0, ...State.topics.filter(t => t.project_id === State.currentProjectId).map(t => t.order_index || 0));
    const newTopic = { ...data, id: uuid(), completed: false, order_index: maxOrder + 1 };
    State.topics.push(newTopic);
    saveTopics();
    logActivity(`Added topic <strong>${esc(title)}</strong>`, 'fa-book-open', '#6366f1');
    showToast('Topic added!', 'success');
  }
  closeModal('modal-topic');
  renderTopics(State.currentProjectId);
  updateProjectProgress(State.currentProjectId);
  renderDashboard();
  renderAllTodos();
}

function confirmDeleteTopic(topicId) {
  const t = State.topics.find(x => x.id === topicId);
  openConfirm('Delete Topic?', `"${t?.title}" and all its subtopics will be deleted.`, () => {
    State.subtopics = State.subtopics.filter(s => s.topic_id !== topicId);
    State.topics    = State.topics.filter(x => x.id !== topicId);
    saveTopics(); saveSubtopics();
    showToast('Topic deleted.', 'info');
    renderTopics(State.currentProjectId);
    updateProjectProgress(State.currentProjectId);
    renderDashboard();
    renderAllTodos();
  });
}

// ============================================================
// TOPIC SIDE PANEL
// ============================================================
function openTopicPanel(topicId) {
  const t = State.topics.find(x => x.id === topicId);
  if (!t) return;
  State.panelTopicId = topicId;
  refreshPanelHeader(topicId);
  renderPanelNotes(t.notes);
  renderPanelLinks(t.links);
  renderPanelSubtopics(topicId);
  document.getElementById('panel-topic').classList.add('open');
  document.getElementById('panel-overlay').classList.add('open');
}

function refreshPanelHeader(topicId) {
  const t = State.topics.find(x => x.id === topicId);
  if (!t) return;
  document.getElementById('panel-topic-name').textContent = t.title;
  document.getElementById('panel-topic-desc').textContent = t.description || '';
  document.getElementById('panel-priority-badge').className   = `priority-badge priority-${t.priority || 'medium'}`;
  document.getElementById('panel-priority-badge').textContent = t.priority || 'medium';
  const tagBadge = document.getElementById('panel-tag-badge');
  tagBadge.textContent   = t.tag || '';
  tagBadge.style.display = t.tag ? 'inline-block' : 'none';
}

function renderPanelNotes(notes) {
  const view = document.getElementById('panel-notes-view');
  if (notes && notes.trim()) {
    view.textContent = notes;
    view.classList.remove('empty');
  } else {
    view.textContent = 'No notes yet. Click the edit button to add notes.';
    view.classList.add('empty');
  }
  document.getElementById('panel-notes-edit').classList.add('hidden');
  document.getElementById('notes-edit-actions').classList.add('hidden');
  document.getElementById('panel-notes-view').classList.remove('hidden');
  document.getElementById('btn-edit-notes').style.display = '';
}

function renderPanelLinks(linksStr) {
  const view = document.getElementById('panel-links-view');
  if (!view) return;
  if (!linksStr || !linksStr.trim()) {
    view.innerHTML = '<p style="color:var(--text-dim);font-size:12.5px;font-style:italic;">No links added. Click the edit button on a topic to add links.</p>';
    return;
  }
  const lines = linksStr.split('\n').map(l => l.trim()).filter(l => l);
  view.innerHTML = lines.map(l => {
    let url = l;
    let text = l;
    if (l.includes('|')) {
      const parts = l.split('|');
      text = parts[0].trim();
      url = parts[1].trim();
    }
    if (!url.startsWith('http')) url = 'https://' + url;
    return `<a href="${esc(url)}" target="_blank" rel="noopener" class="panel-link-item"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${esc(text)}</a>`;
  }).join('');
}

function renderPanelSubtopics(topicId) {
  const subs = State.subtopics.filter(s => s.topic_id === topicId);
  const el   = document.getElementById('panel-subtopics');
  if (!subs.length) {
    el.innerHTML = '<p style="font-size:12px;color:var(--text-dim);">No subtopics yet. Click + to add.</p>';
    return;
  }
  el.innerHTML = subs.map(s => `
    <div class="panel-subtopic-item">
      <div class="subtopic-checkbox ${s.completed ? 'checked' : ''}" onclick="toggleSubtopic('${s.id}','${topicId}')">
        ${s.completed ? '<i class="fa-solid fa-check"></i>' : ''}
      </div>
      <div class="panel-subtopic-info">
        <div class="panel-subtopic-title ${s.completed ? 'done' : ''}">${esc(s.title)}</div>
        ${s.description ? `<div class="panel-subtopic-desc">${esc(s.description)}</div>` : ''}
        ${s.notes ? `<div class="panel-subtopic-desc" style="margin-top:4px;font-size:11px;color:var(--text-dim)">${esc(s.notes.substring(0, 120))}${s.notes.length > 120 ? '…' : ''}</div>` : ''}
        ${s.links ? `<div class="panel-subtopic-links">${renderSubtopicLinks(s.links)}</div>` : ''}
      </div>
      <div class="panel-subtopic-actions">
        <button class="topic-action-btn" onclick="openEditSubtopicModal('${s.id}','${topicId}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="topic-action-btn danger" onclick="confirmDeleteSubtopic('${s.id}','${topicId}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function closeSidePanel() {
  document.getElementById('panel-topic').classList.remove('open');
  document.getElementById('panel-overlay').classList.remove('open');
  State.panelTopicId = null;
}

function renderSubtopicLinks(linksStr) {
  if (!linksStr || !linksStr.trim()) return '';
  const lines = linksStr.split('\n').map(l => l.trim()).filter(l => l);
  return lines.map(l => {
    let url = l; let text = l;
    if (l.includes('|')) {
      const parts = l.split('|');
      text = parts[0].trim(); url = parts[1].trim();
    }
    if (!url.startsWith('http')) url = 'https://' + url;
    return `<a href="${esc(url)}" target="_blank" rel="noopener" class="subtopic-link"><i class="fa-solid fa-link"></i> ${esc(text)}</a>`;
  }).join(' ');
}

// Notes Edit
function editPanelNotes() {
  const t = State.topics.find(x => x.id === State.panelTopicId);
  document.getElementById('panel-notes-edit').value = t?.notes || '';
  document.getElementById('panel-notes-view').classList.add('hidden');
  document.getElementById('panel-notes-edit').classList.remove('hidden');
  document.getElementById('notes-edit-actions').classList.remove('hidden');
  document.getElementById('btn-edit-notes').style.display = 'none';
  document.getElementById('panel-notes-edit').focus();
}

function cancelNotesEdit() {
  const t = State.topics.find(x => x.id === State.panelTopicId);
  renderPanelNotes(t?.notes);
}

function saveNotes() {
  const notes = document.getElementById('panel-notes-edit').value;
  if (!State.panelTopicId) return;
  const t = State.topics.find(x => x.id === State.panelTopicId);
  if (t) t.notes = notes;
  saveTopics();
  renderPanelNotes(notes);
  showToast('Notes saved!', 'success');
}

// ============================================================
// SUBTOPIC MODAL
// ============================================================
function openAddSubtopicModal() {
  State.editingSubtopicId             = null;
  State.editingSubtopicParentTopicId  = State.panelTopicId;
  document.getElementById('modal-subtopic-title').textContent = 'Add Subtopic';
  document.getElementById('subtopic-title-input').value = '';
  document.getElementById('subtopic-desc-input').value  = '';
  document.getElementById('subtopic-notes-input').value = '';
  document.getElementById('subtopic-links-input').value = '';
  openModal('modal-subtopic');
  setTimeout(() => document.getElementById('subtopic-title-input').focus(), 50);
}

function openEditSubtopicModal(subtopicId, topicId) {
  const s = State.subtopics.find(x => x.id === subtopicId);
  if (!s) return;
  State.editingSubtopicId            = subtopicId;
  State.editingSubtopicParentTopicId = topicId;
  document.getElementById('modal-subtopic-title').textContent = 'Edit Subtopic';
  document.getElementById('subtopic-title-input').value = s.title       || '';
  document.getElementById('subtopic-desc-input').value  = s.description || '';
  document.getElementById('subtopic-notes-input').value = s.notes       || '';
  document.getElementById('subtopic-links-input').value = s.links       || '';
  openModal('modal-subtopic');
}

function saveSubtopic() {
  const title = document.getElementById('subtopic-title-input').value.trim();
  if (!title) { showToast('Subtopic title is required.', 'error'); return; }
  const data = {
    title,
    description: document.getElementById('subtopic-desc-input').value.trim(),
    notes:       document.getElementById('subtopic-notes-input').value.trim(),
    links:       document.getElementById('subtopic-links-input').value.trim(),
    topic_id:    State.editingSubtopicParentTopicId,
    project_id:  State.currentProjectId,
  };
  if (State.editingSubtopicId) {
    const idx = State.subtopics.findIndex(s => s.id === State.editingSubtopicId);
    if (idx > -1) State.subtopics[idx] = { ...State.subtopics[idx], ...data };
    showToast('Subtopic updated!', 'success');
  } else {
    const maxOrder = Math.max(0, ...State.subtopics.filter(s => s.topic_id === State.editingSubtopicParentTopicId).map(s => s.order_index || 0));
    State.subtopics.push({ ...data, id: uuid(), completed: false, order_index: maxOrder + 1 });
    showToast('Subtopic added!', 'success');
  }
  saveSubtopics();
  closeModal('modal-subtopic');
  renderTopics(State.currentProjectId);
  if (State.panelTopicId) renderPanelSubtopics(State.panelTopicId);
}

function confirmDeleteSubtopic(subtopicId, topicId) {
  const s = State.subtopics.find(x => x.id === subtopicId);
  openConfirm('Delete Subtopic?', `"${s?.title}" will be deleted.`, () => {
    State.subtopics = State.subtopics.filter(x => x.id !== subtopicId);
    saveSubtopics();
    showToast('Subtopic deleted.', 'info');
    renderTopics(State.currentProjectId);
    if (State.panelTopicId === topicId) renderPanelSubtopics(topicId);
  });
}

// ============================================================
// ALL TODOS VIEW
// ============================================================
function renderAllTodos() {
  const projFilter   = document.getElementById('todo-filter-project')?.value   || '';
  const statusFilter = document.getElementById('todo-filter-status')?.value    || '';
  const el           = document.getElementById('all-todos-list');

  let topics = [...State.topics];
  if (projFilter)                       topics = topics.filter(t => t.project_id === projFilter);
  if (statusFilter === 'completed')     topics = topics.filter(t =>  t.completed);
  if (statusFilter === 'pending')       topics = topics.filter(t => !t.completed);

  if (!topics.length) {
    el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-list-check"></i><h3>No to-dos found</h3><p>Add topics to your projects.</p></div>';
    return;
  }

  const grouped = {};
  topics.forEach(t => {
    if (!grouped[t.project_id]) grouped[t.project_id] = [];
    grouped[t.project_id].push(t);
  });

  el.innerHTML = Object.entries(grouped).map(([pid, pts]) => {
    const proj = State.projects.find(p => p.id === pid);
    return `
      <div>
        <div class="todo-group-header" style="color:${proj?.color || 'var(--accent)'}">
          <i class="fa-solid fa-folder"></i> ${esc(proj?.name || 'Unknown Project')}
        </div>
        ${pts.map(t => `
          <div class="todo-item ${t.completed ? 'completed' : ''}" onclick="switchView('project-detail','${pid}')">
            <div class="todo-check ${t.completed ? 'checked' : ''}" onclick="event.stopPropagation();toggleTopicFromTodo('${t.id}')">
              ${t.completed ? '<i class="fa-solid fa-check"></i>' : ''}
            </div>
            <span class="todo-title">${esc(t.title)}</span>
            ${t.priority ? `<span class="priority-badge priority-${t.priority}">${t.priority}</span>` : ''}
            ${t.tag      ? `<span class="tag-badge">${esc(t.tag)}</span>`                             : ''}
          </div>`).join('')}
      </div>`;
  }).join('');
}

function toggleTopicFromTodo(topicId) {
  const t = State.topics.find(x => x.id === topicId);
  if (!t) return;
  t.completed = !t.completed;
  saveTopics();
  renderAllTodos();
  renderDashboard();
}

// ============================================================
// GLOBAL SEARCH
// ============================================================
document.getElementById('global-search').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  if (!q) return;
  const results = State.topics.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  if (results.length > 0) {
    const first = results[0];
    const proj  = State.projects.find(p => p.id === first.project_id);
    if (proj) switchView('project-detail', proj.id);
  }
});

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeModalOnOverlay(e, id) { if (e.target.id === id) closeModal(id);  }

let confirmCallback = null;
function openConfirm(title, message, cb) {
  document.getElementById('confirm-title').textContent   = title;
  document.getElementById('confirm-message').textContent = message;
  confirmCallback = cb;
  openModal('modal-confirm');
}
document.getElementById('confirm-action-btn').addEventListener('click', () => {
  if (confirmCallback) { confirmCallback(); confirmCallback = null; }
  closeModal('modal-confirm');
});

function showShortcuts() { openModal('modal-shortcuts'); }

// ============================================================
// TOAST
// ============================================================
let toastTimer;
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 3000);
}

// ============================================================
// KEYBOARD
// ============================================================
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    switch (e.key) {
      case 'Escape':
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        closeSidePanel();
        break;
      case '1': switchView('dashboard'); break;
      case '2': switchView('projects');  break;
      case '3': switchView('todos');     break;
      case 'n': case 'N': openNewProjectModal(); break;
      case 't': case 'T':
        if (State.currentView === 'project-detail') openAddTopicModal();
        break;
      case '/': e.preventDefault(); document.getElementById('global-search').focus(); break;
    }
  });
}

// ============================================================
// UTILITIES
// ============================================================
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m    = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ============================================================
// BOOT
// ============================================================
window.addEventListener('DOMContentLoaded', init);
